"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { submitService } from "@/app/actions/service";
import AvailabilityPicker from "@/components/account/AvailabilityPicker";
import PlaceSearch, { type Place } from "@/components/account/PlaceSearch";
import FormMessage from "@/components/account/FormMessage";
import PhoneInput from "@/components/PhoneInput";
import { CONTACT_PREFERENCE, MAINTENANCE_SERVICE, URGENCY, describeAvailability, formatDate } from "@/lib/labels";
import { googleMapsUrl } from "@/lib/geo";
import { isValidPhone } from "@/lib/phone";
import { LOCALE_TAGS, fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

type Contact = { name: string; phone: string; email: string };
export type SavedAddress = { id: string; label: string; address: string; details: string; postcode: string; locality: string; lat: number; lng: number };

// Ícones de linha (estilo técnico, sem emojis)
const svg = (children: React.ReactNode) => (
  <svg className="choice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const ICONS: Record<string, React.ReactNode> = {
  manutencao: svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M9 15.5l2 2 4-4" /></>),
  limpeza: svg(<><path d="M3 11 12 4l9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M15 6.3V3h3v5.6" /><path d="M10 20v-5h4v5" /></>),
  assistencia: svg(<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />),
};

// Pedido de limpeza / manutenção / assistência — sem conta (ou com os dados da conta já preenchidos).
export default function ServiceWizard({
  contact,
  signedIn,
  initialService = "",
  savedAddresses = [],
}: {
  contact: Contact;
  signedIn: boolean;
  initialService?: string;
  savedAddresses?: SavedAddress[];
}) {
  const { t, href, locale } = useI18n();
  const s = t.service;
  const q = t.quote;
  const L = t.labels;
  const STEPS = s.steps;
  const [state, action, pending] = useActionState(submitService, undefined);
  const today = new Date().toISOString().slice(0, 10);

  const empty = {
    service: initialService,
    equipment: "",
    urgency: "normal",
    availability: [] as string[],
    preferred_date: "",
    ...contact,
    place: null as Place | null,
    address_id: "",
    address_details: "",
    contact_preference: "telefone",
    notes: "",
    privacy: false,
  };
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [data, setData] = useState(empty);
  const [stepError, setStepError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) => setData((d) => ({ ...d, [key]: value }));

  const done = submitted && !pending && state?.success;

  function validate(i: number) {
    const e = { ...q.errors, ...s.errors };
    if (i === 0 && !data.service) return e.service;
    if (i === 1 && data.equipment.trim().length < 2) return e.equipment;
    if (i === 1 && data.preferred_date && data.preferred_date < today) return e.date;
    if (i === 2) {
      if (data.name.trim().length < 2) return e.name;
      if (!isValidPhone(data.phone)) return e.phone;
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return e.email;
      if (data.contact_preference === "email" && !data.email.trim()) return e.emailNeeded;
      if (!data.place) return e.place;
    }
    if (i === 3 && !signedIn && !data.privacy) return e.privacy;
    return "";
  }

  function go(to: number) {
    setStepError("");
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const error = validate(step);
    setStepError(error);
    if (error) return;
    if (step < STEPS.length - 1) return go(step + 1);

    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (key === "place") {
        const place = value as Place;
        fd.append("address", place.address);
        fd.append("postcode", place.postcode);
        fd.append("lat", String(place.lat));
        fd.append("lng", String(place.lng));
      } else if (key === "availability") (value as string[]).forEach((v) => fd.append(key, v));
      else if (key === "privacy") fd.append(key, value ? "on" : "");
      else fd.append(key, String(value));
    }
    fd.append("website", honeypot.current?.value ?? "");
    setSubmitted(true);
    startTransition(() => action(fd));
  }

  if (done) {
    const d = s.done;
    return (
      <div className="request-done">
        <div className="request-done-icon" aria-hidden>✓</div>
        <h3>{fmt(d.title, { name: data.name.trim().split(" ")[0] })}</h3>
        {state.emailSent && (
          <p className="muted">
            {d.emailSentBefore} <strong>{data.email.trim()}</strong>{d.emailSentAfter}
          </p>
        )}
        <ol className="timeline">
          <li className="timeline-done"><strong>{d.received}</strong><span>{d.receivedText}</span></li>
          <li><strong>{d.schedule}</strong><span>{d.scheduleText}</span></li>
          <li><strong>{d.confirm}</strong><span>{fmt(d.confirmText, { by: L.contactBy[data.contact_preference] })}</span></li>
        </ol>
        <div className="row" style={{ justifyContent: "center" }}>
          {signedIn && <Link href="/conta/manutencao" className="btn btn-fire">{d.myRequests}</Link>}
          <button
            type="button"
            className="btn btn-ink"
            onClick={() => {
              setSubmitted(false);
              setData(empty);
              setStep(0);
            }}
          >
            {d.another}
          </button>
        </div>
        <Link href={href("/")} className="link" style={{ marginTop: 12 }}>{d.backToSite}</Link>
      </div>
    );
  }

  const chooseSaved = (a: SavedAddress) =>
    setData((d) => ({
      ...d,
      address_id: a.id,
      address_details: a.details,
      place: { address: a.address, postcode: a.postcode, locality: a.locality, lat: a.lat, lng: a.lng, source: "search" },
    }));

  return (
    <form onSubmit={submit} className="form" noValidate>
      <ol className="steps" aria-label={q.stepsAria}>
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "step-current" : i < step ? "step-done" : ""} aria-current={i === step ? "step" : undefined}>
            <button type="button" disabled={i > step} onClick={() => i < step && go(i)}>
              <span className="step-num">{i < step ? "✓" : i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset className="step-body">
          <legend>{s.whatLegend}</legend>
          <div className="choice-grid">
            {Object.keys(MAINTENANCE_SERVICE).map((value) => (
              <button
                type="button"
                key={value}
                className={`choice${data.service === value ? " choice-active" : ""}`}
                aria-pressed={data.service === value}
                onClick={() => {
                  set("service", value);
                  go(1);
                }}
              >
                {ICONS[value]}
                <strong>{L.service[value]?.label}</strong>
                <span className="hint">{L.service[value]?.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="step-body">
          <legend>{s.equipmentLegend}</legend>
          <label className="field">
            {s.equipment}
            <span className="hint">{s.equipmentHint}</span>
            <input value={data.equipment} onChange={(e) => set("equipment", e.target.value)} maxLength={200} autoFocus />
          </label>
          <div className="field">
            {s.urgency}
            <div className="choice-grid choice-grid-3">
              {Object.keys(URGENCY).map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`choice choice-sm${data.urgency === value ? " choice-active" : ""}`}
                  aria-pressed={data.urgency === value}
                  onClick={() => set("urgency", value)}
                >
                  <strong>{L.urgency[value]?.label}</strong>
                  <span className="hint">{L.urgency[value]?.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="info-box">{s.whenInfo}</p>
          <AvailabilityPicker value={data.availability} onChange={(v) => set("availability", v)} />
          <label className="field" style={{ maxWidth: 320 }}>
            {s.from} <span className="hint">{s.fromHint}</span>
            <input type="date" min={today} value={data.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} />
          </label>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="step-body">
          <legend>{s.contactLegend}</legend>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              {q.name}
              <input autoComplete="name" value={data.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
            </label>
            <div className="field" style={{ flex: 1, minWidth: 240 }}>
              {q.phone}
              <PhoneInput value={data.phone} onChange={(v) => set("phone", v)} required />
            </div>
          </div>
          <label className="field">
            {q.email} <span className="hint">{s.emailHint}</span>
            <input type="email" autoComplete="email" value={data.email} onChange={(e) => set("email", e.target.value)} maxLength={200} />
          </label>
          <div className="field" role="group" aria-label={s.address}>
            {s.address}
            <span className="hint">{q.addressHint}</span>
          </div>
          {data.place ? (
            <div className="item">
              <div className="item-head">
                <strong>{data.place.address}</strong>
                <span className="badge">{data.place.source === "gps" ? q.gps : q.verified}</span>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <a className="link" href={googleMapsUrl(data.place.lat, data.place.lng)} target="_blank" rel="noreferrer">
                  {q.confirmMap}
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setData((d) => ({ ...d, place: null, address_id: "" }))}>
                  {q.change}
                </button>
              </div>
            </div>
          ) : (
            <>
              {savedAddresses.length > 0 && (
                <div className="list" style={{ gap: 6 }}>
                  <span className="hint">{q.saved}</span>
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="item"
                      style={{ width: "100%", textAlign: "left", cursor: "pointer", font: "inherit" }}
                      onClick={() => chooseSaved(a)}
                    >
                      <strong>{a.label}</strong> — {a.address}
                    </button>
                  ))}
                  <span className="hint">{q.orSearch}</span>
                </div>
              )}
              <PlaceSearch onSelect={(place) => setData((d) => ({ ...d, place, address_id: "" }))} placeholder={s.addressPlaceholder} />
            </>
          )}
          <label className="field">
            {q.details} <span className="hint">{q.detailsHint}</span>
            <input value={data.address_details} onChange={(e) => set("address_details", e.target.value)} maxLength={200} />
          </label>
          <label className="field" style={{ maxWidth: 320 }}>
            {q.contactPref}
            <select value={data.contact_preference} onChange={(e) => set("contact_preference", e.target.value)}>
              {Object.keys(CONTACT_PREFERENCE).map((v) => <option key={v} value={v}>{L.contactPreference[v]}</option>)}
            </select>
          </label>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="step-body">
          <legend>{q.confirmLegend}</legend>
          <dl className="summary">
            <div><dt>{s.sumService}</dt><dd>{L.service[data.service]?.label}</dd></div>
            <div><dt>{s.sumEquipment}</dt><dd>{data.equipment}</dd></div>
            <div><dt>{s.sumWhen}</dt><dd>{L.urgency[data.urgency]?.label} · {describeAvailability(data.availability, L)}</dd></div>
            {data.preferred_date && <div><dt>{s.sumFrom}</dt><dd>{formatDate(data.preferred_date, false, LOCALE_TAGS[locale])}</dd></div>}
            <div><dt>{q.sumContact}</dt><dd>{data.name} · {data.phone}{data.email && ` · ${data.email}`}</dd></div>
            <div><dt>{q.sumAddress}</dt><dd>{data.place?.address}{data.address_details && ` (${data.address_details})`}</dd></div>
            <div><dt>{q.sumContactBy}</dt><dd>{L.contactPreference[data.contact_preference]}</dd></div>
          </dl>
          <label className="field">
            {s.notes} <span className="hint">{s.notesHint}</span>
            <textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} maxLength={2000} style={{ minHeight: 80 }} />
          </label>
          <p className="info-box">
            {s.notFinalBefore} <strong>{s.notFinalStrong}</strong>{s.notFinalAfter}
          </p>
          {!signedIn && (
            <label className="check">
              <input type="checkbox" checked={data.privacy} onChange={(e) => set("privacy", e.target.checked)} />
              <span>
                {q.privacyBefore}{" "}
                <Link className="link" href={href("/privacidade")} target="_blank">{q.privacyLink}</Link>.
              </span>
            </label>
          )}
        </fieldset>
      )}

      {/* Armadilha para robôs: invisível para pessoas */}
      <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hp" />

      {stepError ? <p className="alert alert-error" role="alert">{stepError}</p> : <FormMessage state={submitted && state?.error ? { error: state.error } : undefined} />}

      <div className="step-actions">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>
            {q.back}
          </button>
        )}
        {step > 0 && (
          <button className="btn btn-fire" disabled={pending}>
            {step < STEPS.length - 1 ? q.continue : pending ? q.sending : q.send}
          </button>
        )}
      </div>
    </form>
  );
}
