"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { submitQuote } from "@/app/actions/quote";
import AvailabilityPicker from "@/components/account/AvailabilityPicker";
import PlaceSearch, { type Place } from "@/components/account/PlaceSearch";
import FormMessage from "@/components/account/FormMessage";
import {
  CHIMNEY,
  CONTACT_PREFERENCE,
  FUEL,
  HOME_TYPE,
  QUOTE_PRODUCTS,
  WORK_TYPE,
  describeAvailability,
  quoteRef,
} from "@/lib/labels";
import { companyWhatsappUrl } from "@/lib/notify";
import { googleMapsUrl } from "@/lib/geo";
import { FREE_VISIT_MUNICIPALITIES, OTHER_MUNICIPALITY, municipalityFromPostcode } from "@/lib/service-area";
import PhoneInput from "@/components/PhoneInput";
import { isValidPhone } from "@/lib/phone";

type Contact = { name: string; phone: string; email: string };
export type SavedAddress = { id: string; label: string; address: string; details: string; postcode: string; locality: string; lat: number; lng: number };
type Photo = { file: File; url: string };

const STEPS = ["O que procura", "A obra", "Fotos", "Visita", "Confirmar"];
const MAX_PHOTOS = 6;

// Fotos de telemóvel têm 3–8 MB: reduz para 1600 px em JPEG antes de enviar.
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("conversion failed");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
}

function Choices({
  options,
  value,
  onChange,
}: {
  options: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="choice-grid choice-grid-3">
      {Object.entries(options).map(([v, label]) => (
        <button
          type="button"
          key={v}
          className={`choice choice-sm${value === v ? " choice-active" : ""}`}
          aria-pressed={value === v}
          onClick={() => onChange(value === v ? "" : v)}
        >
          <strong>{label}</strong>
        </button>
      ))}
    </div>
  );
}

export default function QuoteWizard({
  contact,
  signedIn,
  initial = { category: "", fuel: "" },
  savedAddresses = [],
}: {
  contact: Contact;
  signedIn: boolean;
  initial?: { category: string; fuel: string };
  savedAddresses?: SavedAddress[];
}) {
  const [state, action, pending] = useActionState(submitQuote, undefined);

  const empty = {
    category: initial.category,
    work_type: "",
    home_type: "",
    chimney: "",
    area_m2: "",
    fuel: initial.fuel,
    message: "",
    ...contact,
    municipality: "",
    other_municipality: "",
    place: null as Place | null,
    address_details: "",
    availability: [] as string[],
    contact_preference: "telefone",
    privacy: false,
  };
  const [step, setStep] = useState(0);
  const [data, setData] = useState(empty);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [stepError, setStepError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) => setData((d) => ({ ...d, [key]: value }));

  // Ao escolher a morada, o concelho fica preenchido sozinho pelo código postal (zona gratuita).
  function choosePlace(place: Place, details = "") {
    const known = municipalityFromPostcode(place.postcode);
    setData((d) => ({
      ...d,
      place,
      address_details: details || d.address_details,
      municipality: known || (place.postcode ? OTHER_MUNICIPALITY : d.municipality),
      other_municipality: known ? "" : d.other_municipality,
    }));
  }

  const done = submitted && !pending && state?.success;
  const outside = data.municipality === OTHER_MUNICIPALITY;

  // Libertar as pré-visualizações das fotos ao sair.
  const previewUrls = useRef<string[]>([]);
  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function validate(s: number) {
    if (s === 0 && !data.category) return "Escolha o que procura.";
    if (s === 1 && !data.work_type) return "Indique o tipo de obra.";
    if (s === 1 && !data.home_type) return "Indique o tipo de casa.";
    if (s === 1 && data.area_m2 && (Number(data.area_m2) < 5 || Number(data.area_m2) > 2000)) return "A área deve estar entre 5 e 2000 m².";
    if (s === 3) {
      if (data.name.trim().length < 2) return "Indique o seu nome.";
      if (!isValidPhone(data.phone)) return "Indique um número de telefone válido.";
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return "O email não parece válido.";
      if (data.contact_preference === "email" && !data.email.trim()) return "Indique o email para o podermos contactar.";
      if (!data.municipality) return "Escolha o concelho da obra.";
      if (outside && data.other_municipality.trim().length < 2) return "Indique o concelho ou localidade da obra.";
      if (!data.place) return "Escolha a morada da obra na pesquisa (ou use a sua localização).";
    }
    if (s === 4 && !signedIn && !data.privacy) return "Para enviarmos o pedido, aceite a Política de Privacidade.";
    return "";
  }

  function go(to: number) {
    setStepError("");
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    const error = validate(step);
    setStepError(error);
    if (!error) go(step + 1);
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const chosen = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    setPhotoBusy(true);
    const added: Photo[] = [];
    let failed = 0;
    for (const file of chosen) {
      try {
        const small = await shrink(file);
        const url = URL.createObjectURL(small);
        previewUrls.current.push(url);
        added.push({ file: small, url });
      } catch {
        failed++;
      }
    }
    setPhotos((p) => [...p, ...added]);
    setPhotoBusy(false);
    setStepError(
      failed
        ? `Não conseguimos abrir ${failed} das fotos. Experimente tirar a foto em JPG, ou envie-a depois por WhatsApp.`
        : files.length > room
          ? `Pode enviar até ${MAX_PHOTOS} fotos.`
          : "",
    );
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    setPhotos((p) => p.filter((_, j) => j !== i));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    const error = validate(step);
    setStepError(error);
    if (error) return;

    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (key === "place") {
        // Só moradas reais: vai a morada encontrada na pesquisa, com as coordenadas.
        const place = value as Place;
        fd.append("address", place.address);
        fd.append("postcode", place.postcode);
        fd.append("locality", place.locality);
        fd.append("lat", String(place.lat));
        fd.append("lng", String(place.lng));
      } else if (key === "availability") (value as string[]).forEach((v) => fd.append(key, v));
      else if (key === "privacy") fd.append(key, value ? "on" : "");
      else fd.append(key, String(value));
    }
    photos.forEach((p) => fd.append("photos", p.file));
    fd.append("website", honeypot.current?.value ?? "");
    setSubmitted(true);
    startTransition(() => action(fd));
  }

  if (done) {
    const whatsapp = state.ref ? companyWhatsappUrl(`Olá! Acabei de fazer o pedido de orçamento ${quoteRef(state.ref)} no site.`) : "";
    return (
      <div className="request-done">
        <div className="request-done-icon" aria-hidden>✓</div>
        <h3>Pedido enviado — obrigado, {data.name.trim().split(" ")[0]}!</h3>
        {state.ref && (
          <div className="ref-box">
            <span>Referência do seu pedido</span>
            <strong>{quoteRef(state.ref)}</strong>
          </div>
        )}
        <p className="muted">
          {state.emailSent ? (
            <>Enviámos a confirmação para <strong>{data.email.trim()}</strong>. Guarde-a como comprovativo.</>
          ) : (
            <>Guarde a referência ou abra o comprovativo abaixo (pode imprimi-lo ou guardá-lo em PDF).</>
          )}
        </p>
        <div className="row" style={{ justifyContent: "center", margin: "6px 0 4px" }}>
          {state.id && (
            <Link href={`/pedido/${state.id}`} className="btn btn-fire btn-sm" target="_blank">
              Ver comprovativo
            </Link>
          )}
          {whatsapp && (
            <a href={whatsapp} className="btn btn-whatsapp btn-sm" target="_blank" rel="noreferrer">
              Enviar a referência por WhatsApp
            </a>
          )}
        </div>
        <ol className="timeline">
          <li className="timeline-done"><strong>Pedido recebido</strong><span>A nossa equipa já foi avisada.</span></li>
          <li>
            <strong>Marcamos a visita técnica</strong>
            <span>
              Contactamo-lo por {CONTACT_PREFERENCE[data.contact_preference].toLowerCase()} para combinar o dia, dentro das suas
              preferências.
            </span>
          </li>
          <li><strong>Visita sem compromisso</strong><span>Vemos o espaço, a chaminé e o que faz sentido para a sua casa.</span></li>
          <li><strong>Orçamento</strong><span>Enviamos o orçamento detalhado. Decide com calma.</span></li>
        </ol>
        {signedIn ? (
          <Link href="/conta/orcamentos" className="btn btn-fire">Ver os meus pedidos</Link>
        ) : (
          <div className="info-box" style={{ maxWidth: 460, textAlign: "left" }}>
            <strong>Quer acompanhar o pedido online?</strong> É opcional.{" "}
            {data.email ? (
              <>Crie uma conta com o email <strong>{data.email.trim()}</strong> e este pedido aparece no seu histórico.</>
            ) : (
              <>Crie uma conta com o seu email e os próximos pedidos ficam guardados no seu histórico.</>
            )}{" "}
            <Link className="link" href="/registar">Criar conta →</Link>
          </div>
        )}
        <Link href="/" className="link" style={{ marginTop: 12 }}>← Voltar ao site</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form" noValidate>
      <ol className="steps" aria-label="Passos do pedido">
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
          <legend>O que procura?</legend>
          <div className="media-grid">
            {Object.entries(QUOTE_PRODUCTS).map(([value, info]) => (
              <button
                type="button"
                key={value}
                className={`choice-media${data.category === value ? " choice-active" : ""}`}
                aria-pressed={data.category === value}
                style={{ backgroundImage: `url(${info.img})`, backgroundPosition: info.pos }}
                onClick={() => {
                  set("category", value);
                  go(1);
                }}
              >
                <strong>{value}</strong>
                <span>{info.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="step-body">
          <legend>Conte-nos sobre a obra</legend>
          <div className="field">
            Tipo de obra
            <Choices options={WORK_TYPE} value={data.work_type} onChange={(v) => set("work_type", v)} />
          </div>
          <div className="field">
            Tipo de casa
            <Choices options={HOME_TYPE} value={data.home_type} onChange={(v) => set("home_type", v)} />
          </div>
          <div className="field">
            Já tem chaminé? <span className="hint">Opcional</span>
            <Choices options={CHIMNEY} value={data.chimney} onChange={(v) => set("chimney", v)} />
          </div>
          <div className="field">
            Combustível preferido <span className="hint">Opcional</span>
            <Choices options={FUEL} value={data.fuel} onChange={(v) => set("fuel", v)} />
          </div>
          <label className="field" style={{ maxWidth: 260 }}>
            Área a aquecer (m²) <span className="hint">Opcional — um valor aproximado chega</span>
            <input type="number" inputMode="numeric" min={5} max={2000} value={data.area_m2} onChange={(e) => set("area_m2", e.target.value)} />
          </label>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="step-body">
          <legend>Fotos do espaço</legend>
          <p className="info-box">
            Opcional, mas ajuda muito: 2 ou 3 fotos da sala onde quer o equipamento e da chaminé (se tiver). Assim
            preparamos melhor a visita.
          </p>
          <div className="photo-grid">
            {photos.map((p, i) => (
              <figure key={p.url} className="photo-thumb">
                <img src={p.url} alt={`Foto ${i + 1}`} />
                <button type="button" onClick={() => removePhoto(i)} aria-label={`Remover foto ${i + 1}`}>×</button>
              </figure>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="photo-add">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    void addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                  disabled={photoBusy}
                />
                <span aria-hidden>{photoBusy ? "…" : "+"}</span>
                {photoBusy ? "A preparar…" : photos.length ? "Mais fotos" : "Adicionar fotos"}
              </label>
            )}
          </div>
          <span className="hint">{photos.length}/{MAX_PHOTOS} fotos</span>
          <label className="field">
            Quer acrescentar alguma coisa? <span className="hint">Opcional — o que imagina, um modelo que viu no site, medidas…</span>
            <textarea value={data.message} onChange={(e) => set("message", e.target.value)} maxLength={4000} style={{ minHeight: 90 }} />
          </label>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="step-body">
          <legend>Visita técnica</legend>
          <p className="info-box">
            Cada casa é diferente, por isso o orçamento é feito depois de uma <strong>visita técnica gratuita</strong>, sem
            compromisso, nos concelhos do Alto Minho (até cerca de 50 km de Monção).
          </p>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              Nome
              <input autoComplete="name" value={data.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
            </label>
            <div className="field" style={{ flex: 1, minWidth: 240 }}>
              Telefone
              <PhoneInput value={data.phone} onChange={(v) => set("phone", v)} required />
            </div>
          </div>
          <label className="field">
            Email <span className="hint">Opcional — para receber o orçamento por email</span>
            <input type="email" autoComplete="email" value={data.email} onChange={(e) => set("email", e.target.value)} maxLength={200} />
          </label>
          <div className="field" role="group" aria-label="Morada da obra">
            Morada da obra
            <span className="hint">Escolha uma morada real da pesquisa — assim o técnico chega à porta com o Google Maps ou o Waze.</span>
          </div>
          {data.place ? (
            <div className="item">
              <div className="item-head">
                <strong>{data.place.address}</strong>
                <span className="badge">{data.place.source === "gps" ? "Localização GPS" : "Morada verificada"}</span>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <a className="link" href={googleMapsUrl(data.place.lat, data.place.lng)} target="_blank" rel="noreferrer">
                  Confirmar no mapa ↗
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("place", null)}>
                  Alterar
                </button>
              </div>
            </div>
          ) : (
            <>
              {savedAddresses.length > 0 && (
                <div className="list" style={{ gap: 6 }}>
                  <span className="hint">As suas moradas guardadas</span>
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="item"
                      style={{ width: "100%", textAlign: "left", cursor: "pointer", font: "inherit" }}
                      onClick={() =>
                        choosePlace(
                          { address: a.address, postcode: a.postcode, locality: a.locality, lat: a.lat, lng: a.lng, source: "search" },
                          a.details,
                        )
                      }
                    >
                      <strong>{a.label}</strong> — {a.address}
                    </button>
                  ))}
                  <span className="hint">Ou procure outra morada:</span>
                </div>
              )}
              <PlaceSearch onSelect={(place) => choosePlace(place)} placeholder="Rua e localidade da obra" />
            </>
          )}
          <label className="field">
            Nº de porta, andar, indicações <span className="hint">Opcional — ex.: nº 25, portão verde</span>
            <input value={data.address_details} onChange={(e) => set("address_details", e.target.value)} maxLength={200} />
          </label>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              Concelho da obra <span className="hint">Preenchido pela morada — confirme</span>
              <select value={data.municipality} onChange={(e) => set("municipality", e.target.value)}>
                <option value="" disabled>Escolha…</option>
                <optgroup label="Visita gratuita">
                  {FREE_VISIT_MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
                </optgroup>
                <option value={OTHER_MUNICIPALITY}>Outro concelho</option>
              </select>
            </label>
            {outside && (
              <label className="field" style={{ flex: 1, minWidth: 200 }}>
                Qual?
                <input value={data.other_municipality} onChange={(e) => set("other_municipality", e.target.value)} maxLength={80} placeholder="Ex.: Braga" />
              </label>
            )}
          </div>
          {outside && (
            <p className="info-box">
              Fora do Alto Minho também vamos, mas a deslocação pode ter um custo. Se for o caso, dizemos-lhe o valor
              antes de marcar a visita.
            </p>
          )}
          <AvailabilityPicker value={data.availability} onChange={(v) => set("availability", v)} />

          <label className="field" style={{ maxWidth: 320 }}>
            Como prefere ser contactado?
            <select value={data.contact_preference} onChange={(e) => set("contact_preference", e.target.value)}>
              {Object.entries(CONTACT_PREFERENCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="step-body">
          <legend>Confirme o seu pedido</legend>
          <dl className="summary">
            <div><dt>Procura</dt><dd>{data.category}</dd></div>
            <div>
              <dt>Obra</dt>
              <dd>
                {[WORK_TYPE[data.work_type], HOME_TYPE[data.home_type], data.area_m2 && `${data.area_m2} m²`].filter(Boolean).join(" · ")}
              </dd>
            </div>
            {(data.chimney || data.fuel) && (
              <div>
                <dt>Detalhes</dt>
                <dd>{[data.chimney && `Chaminé: ${CHIMNEY[data.chimney].toLowerCase()}`, FUEL[data.fuel]].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
            <div><dt>Fotos</dt><dd>{photos.length ? `${photos.length} foto${photos.length > 1 ? "s" : ""}` : "Sem fotos"}</dd></div>
            <div><dt>Contacto</dt><dd>{data.name} · {data.phone}{data.email && ` · ${data.email}`}</dd></div>
            <div><dt>Morada</dt><dd>{data.place?.address}{data.address_details && ` (${data.address_details})`}{outside && data.other_municipality ? ` · ${data.other_municipality}` : ""}</dd></div>
            <div><dt>Disponível</dt><dd>{describeAvailability(data.availability)}</dd></div>
            <div><dt>Contactar por</dt><dd>{CONTACT_PREFERENCE[data.contact_preference]}</dd></div>
          </dl>
          <p className="info-box">
            Isto <strong>não é um orçamento final</strong>. Vamos contactá-lo para marcar a visita técnica, sem compromisso.
          </p>
          {!signedIn && (
            <label className="check">
              <input type="checkbox" checked={data.privacy} onChange={(e) => set("privacy", e.target.checked)} />
              <span>
                Aceito que a Lareiras Pachinha use estes dados para responder ao meu pedido, nos termos da{" "}
                <Link className="link" href="/privacidade" target="_blank">Política de Privacidade</Link>.
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
            ← Voltar
          </button>
        )}
        {step > 0 && (
          <button className="btn btn-fire" disabled={pending || photoBusy}>
            {step < STEPS.length - 1 ? "Continuar →" : pending ? "A enviar…" : "Enviar pedido"}
          </button>
        )}
      </div>
    </form>
  );
}
