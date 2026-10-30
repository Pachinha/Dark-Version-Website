"use client";

import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { createMaintenance } from "@/app/actions/account";
import FormMessage from "@/components/account/FormMessage";
import AvailabilityPicker from "@/components/account/AvailabilityPicker";
import {
  CONTACT_PREFERENCE,
  MAINTENANCE_SERVICE,
  URGENCY,
  describeAvailability,
  formatDate,
} from "@/lib/labels";

type Address = { id: string; label: string; address: string; details: string };

// Ícones de linha (estilo técnico, sem emojis)
const svg = (children: React.ReactNode) => (
  <svg className="choice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const SERVICE_INFO: Record<string, { icon: React.ReactNode; desc: string }> = {
  manutencao: {
    icon: svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M9 15.5l2 2 4-4" /></>),
    desc: "Revisão completa, vedações, tiragem e afinação.",
  },
  limpeza: {
    icon: svg(<><path d="M3 11 12 4l9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M15 6.3V3h3v5.6" /><path d="M10 20v-5h4v5" /></>),
    desc: "Limpeza da chaminé e condutas, com certificado.",
  },
  assistencia: {
    icon: svg(<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />),
    desc: "Diagnóstico e reparação de avarias.",
  },
};

const STEPS = ["Serviço", "Equipamento", "Disponibilidade", "Confirmar"];

export default function MaintenanceForm({ addresses, needsPhone }: { addresses: Address[]; needsPhone: boolean }) {
  const [state, action, pending] = useActionState(createMaintenance, undefined);
  const today = new Date().toISOString().slice(0, 10);

  const empty = {
    service: "",
    equipment: "",
    address_id: addresses[0]?.id ?? "",
    phone: "",
    urgency: "normal",
    availability: [] as string[],
    preferred_date: "",
    contact_preference: "telefone",
    notes: "",
  };
  const [step, setStep] = useState(0);
  const [data, setData] = useState(empty);
  const [stepError, setStepError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) => setData((d) => ({ ...d, [key]: value }));

  const done = submitted && !pending && state?.success;

  function validate(s: number) {
    if (s === 0 && !data.service) return "Escolha o tipo de serviço.";
    if (s === 1 && data.equipment.trim().length < 2) return "Indique o equipamento (ex.: recuperador a lenha Solzaima).";
    if (s === 1 && needsPhone && data.phone.replace(/\D/g, "").length < 9) return "Indique um número de telefone válido.";
    return "";
  }

  function next() {
    const error = validate(step);
    setStepError(error);
    if (!error) setStep((s) => s + 1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (key === "availability") (value as string[]).forEach((v) => fd.append(key, v));
      else if (key !== "phone" || needsPhone) fd.append(key, value as string);
    }
    setSubmitted(true);
    startTransition(() => action(fd));
  }

  if (done) {
    return (
      <div className="request-done">
        <div className="request-done-icon" aria-hidden>✓</div>
        <h3>Pedido enviado</h3>
        <p className="muted">{state.success}</p>
        <ol className="timeline">
          <li className="timeline-done"><strong>Pedido recebido</strong><span>Já temos todos os dados do seu equipamento.</span></li>
          <li><strong>O secretariado marca a visita</strong><span>Escolhemos uma data dentro das suas preferências.</span></li>
          <li><strong>Confirmação</strong><span>Contactamo-lo por {CONTACT_PREFERENCE[data.contact_preference].toLowerCase()} com o dia e a hora.</span></li>
        </ol>
        <button
          type="button"
          className="btn btn-ink"
          onClick={() => {
            setSubmitted(false);
            setData(empty);
            setStep(0);
          }}
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  const address = addresses.find((a) => a.id === data.address_id);

  return (
    <form onSubmit={submit} className="form" noValidate>
      <ol className="steps" aria-label="Passos do pedido">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "step-current" : i < step ? "step-done" : ""} aria-current={i === step ? "step" : undefined}>
            <button type="button" disabled={i > step} onClick={() => i < step && setStep(i)}>
              <span className="step-num">{i < step ? "✓" : i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset className="step-body">
          <legend>De que precisa?</legend>
          <div className="choice-grid">
            {Object.entries(MAINTENANCE_SERVICE).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`choice${data.service === value ? " choice-active" : ""}`}
                aria-pressed={data.service === value}
                onClick={() => {
                  set("service", value);
                  setStepError("");
                  setStep(1);
                }}
              >
                {SERVICE_INFO[value]?.icon}
                <strong>{label}</strong>
                <span className="hint">{SERVICE_INFO[value]?.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="step-body">
          <legend>Sobre o equipamento</legend>
          <label className="field">
            Equipamento
            <span className="hint">Ex.: recuperador a lenha, salamandra a pellets — marca/modelo se souber</span>
            <input value={data.equipment} onChange={(e) => set("equipment", e.target.value)} maxLength={200} autoFocus />
          </label>
          <label className="field">
            Morada do serviço
            <select value={data.address_id} onChange={(e) => set("address_id", e.target.value)}>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.address}{a.details ? ` (${a.details})` : ""}
                </option>
              ))}
            </select>
            <Link href="/conta/moradas" className="hint">+ Adicionar outra morada</Link>
          </label>
          {needsPhone && (
            <label className="field">
              Telefone <span className="hint">Para o secretariado o contactar e confirmar a visita</span>
              <input type="tel" autoComplete="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="step-body">
          <legend>Quando lhe dá mais jeito?</legend>
          <p className="info-box">
            Não precisa de escolher uma hora exata: indique as suas preferências e o nosso secretariado marca a
            visita de acordo com a agenda dos técnicos.
          </p>

          <div className="field">
            Quando precisa do serviço?
            <div className="choice-grid choice-grid-3">
              {Object.entries(URGENCY).map(([value, u]) => (
                <button
                  type="button"
                  key={value}
                  className={`choice choice-sm${data.urgency === value ? " choice-active" : ""}`}
                  aria-pressed={data.urgency === value}
                  onClick={() => set("urgency", value)}
                >
                  <strong>{u.label}</strong>
                  <span className="hint">{u.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <AvailabilityPicker value={data.availability} onChange={(v) => set("availability", v)} />

          <div className="row" style={{ alignItems: "flex-start" }}>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              Disponível a partir de <span className="hint">Opcional — ex.: se estiver fora até lá</span>
              <input type="date" min={today} value={data.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} />
            </label>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              Como prefere ser contactado?
              <select value={data.contact_preference} onChange={(e) => set("contact_preference", e.target.value)}>
                {Object.entries(CONTACT_PREFERENCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="step-body">
          <legend>Confirme o seu pedido</legend>
          <dl className="summary">
            <div><dt>Serviço</dt><dd>{MAINTENANCE_SERVICE[data.service]}</dd></div>
            <div><dt>Equipamento</dt><dd>{data.equipment}</dd></div>
            <div><dt>Morada</dt><dd>{address ? `${address.label} — ${address.address}` : "—"}</dd></div>
            <div><dt>Quando</dt><dd>{URGENCY[data.urgency].label} · {describeAvailability(data.availability)}</dd></div>
            {data.preferred_date && <div><dt>A partir de</dt><dd>{formatDate(data.preferred_date)}</dd></div>}
            <div><dt>Contacto</dt><dd>{CONTACT_PREFERENCE[data.contact_preference]}{needsPhone && data.phone ? ` · ${data.phone}` : ""}</dd></div>
          </dl>
          <label className="field">
            Observações <span className="hint">Opcional — problema, acesso ao local, horários a evitar…</span>
            <textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} maxLength={2000} style={{ minHeight: 80 }} />
          </label>
          <p className="info-box">
            Isto é um <strong>pedido</strong>, não uma marcação. A visita só fica confirmada quando o secretariado
            o contactar com a data e a hora.
          </p>
        </fieldset>
      )}

      {stepError ? <p className="alert alert-error" role="alert">{stepError}</p> : <FormMessage state={submitted && state?.error ? state : undefined} />}

      <div className="step-actions">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => { setStepError(""); setStep((s) => s - 1); }}>
            ← Voltar
          </button>
        )}
        {step > 0 && (
          <button className="btn btn-fire" disabled={pending}>
            {step < STEPS.length - 1 ? "Continuar →" : pending ? "A enviar…" : "Enviar pedido"}
          </button>
        )}
      </div>
    </form>
  );
}
