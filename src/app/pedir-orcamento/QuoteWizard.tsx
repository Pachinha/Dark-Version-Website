"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { submitQuote } from "@/app/actions/quote";
import AvailabilityPicker from "@/components/account/AvailabilityPicker";
import PlaceSearch, { type Place } from "@/components/account/PlaceSearch";
import FormMessage from "@/components/account/FormMessage";
import { CONTACT_PREFERENCE, QUOTE_PRODUCTS, describeAvailability, quoteRef } from "@/lib/labels";
import { companyWhatsappUrl } from "@/lib/notify";
import { googleMapsUrl } from "@/lib/geo";
import { FREE_VISIT_MUNICIPALITIES, OTHER_MUNICIPALITY, municipalityFromPostcode } from "@/lib/service-area";
import PhoneInput from "@/components/PhoneInput";
import { shrinkImage as shrink } from "@/lib/shrink-image";
import { isValidPhone } from "@/lib/phone";
import { fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

type Contact = { name: string; phone: string; email: string };
export type SavedAddress = { id: string; label: string; address: string; details: string; postcode: string; locality: string; lat: number; lng: number };
type Photo = { file: File; url: string };

const MAX_PHOTOS = 6;

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
  initial = { category: "", fuel: "", message: "" },
  savedAddresses = [],
}: {
  contact: Contact;
  signedIn: boolean;
  initial?: { category: string; fuel: string; message?: string };
  savedAddresses?: SavedAddress[];
}) {
  const { t, href } = useI18n();
  const q = t.quote;
  const L = t.labels;
  const STEPS = q.steps;
  const [state, action, pending] = useActionState(submitQuote, undefined);

  const empty = {
    category: initial.category,
    work_type: "",
    home_type: "",
    chimney: "",
    area_m2: "",
    fuel: initial.fuel,
    message: initial.message ?? "",
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
    const e = q.errors;
    if (s === 0 && !data.category) return e.category;
    if (s === 1 && !data.work_type) return e.workType;
    if (s === 1 && !data.home_type) return e.homeType;
    if (s === 1 && data.area_m2 && (Number(data.area_m2) < 5 || Number(data.area_m2) > 2000)) return e.area;
    if (s === 3) {
      if (data.name.trim().length < 2) return e.name;
      if (!isValidPhone(data.phone)) return e.phone;
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return e.email;
      if (data.contact_preference === "email" && !data.email.trim()) return e.emailNeeded;
      if (!data.municipality) return e.municipality;
      if (outside && data.other_municipality.trim().length < 2) return e.otherMunicipality;
      if (!data.place) return e.place;
    }
    if (s === 4 && !signedIn && !data.privacy) return e.privacy;
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
        ? fmt(q.errors.photosFailed, { n: failed })
        : files.length > room
          ? fmt(q.errors.maxPhotos, { max: MAX_PHOTOS })
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
    const whatsapp = state.ref ? companyWhatsappUrl(fmt(q.done.whatsappText, { ref: quoteRef(state.ref) })) : "";
    const d = q.done;
    return (
      <div className="request-done">
        <div className="request-done-icon" aria-hidden>✓</div>
        <h3>{fmt(d.title, { name: data.name.trim().split(" ")[0] })}</h3>
        {state.ref && (
          <div className="ref-box">
            <span>{d.refLabel}</span>
            <strong>{quoteRef(state.ref)}</strong>
          </div>
        )}
        <p className="muted">
          {state.emailSent ? (
            <>{d.emailSentBefore} <strong>{data.email.trim()}</strong>{d.emailSentAfter}</>
          ) : (
            <>{d.keepRef}</>
          )}
        </p>
        <div className="row" style={{ justifyContent: "center", margin: "6px 0 4px" }}>
          {state.id && (
            <Link href={href(`/pedido/${state.id}`)} className="btn btn-fire btn-sm" target="_blank">
              {d.seeReceipt}
            </Link>
          )}
          {whatsapp && (
            <a href={whatsapp} className="btn btn-whatsapp btn-sm" target="_blank" rel="noreferrer">
              {d.whatsappRef}
            </a>
          )}
        </div>
        <ol className="timeline">
          <li className="timeline-done"><strong>{d.received}</strong><span>{d.receivedText}</span></li>
          <li>
            <strong>{d.schedule}</strong>
            <span>{fmt(d.scheduleText, { by: L.contactBy[data.contact_preference] })}</span>
          </li>
          <li><strong>{d.visit}</strong><span>{d.visitText}</span></li>
          <li><strong>{d.quote}</strong><span>{d.quoteText}</span></li>
        </ol>
        {signedIn ? (
          <Link href="/conta/orcamentos" className="btn btn-fire">{d.myRequests}</Link>
        ) : (
          <div className="info-box" style={{ maxWidth: 460, textAlign: "left" }}>
            <strong>{d.followTitle}</strong> {d.followOptional}{" "}
            {data.email ? (
              <>{d.followWithEmailBefore} <strong>{data.email.trim()}</strong> {d.followWithEmailAfter}</>
            ) : (
              <>{d.followNoEmail}</>
            )}{" "}
            <Link className="link" href="/registar">{d.createAccount}</Link>
          </div>
        )}
        <Link href={href("/")} className="link" style={{ marginTop: 12 }}>{d.backToSite}</Link>
      </div>
    );
  }

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
          <legend>{q.whatLegend}</legend>
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
                <strong>{L.products[value]?.label ?? value}</strong>
                <span>{L.products[value]?.desc ?? info.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="step-body">
          <legend>{q.workLegend}</legend>
          <div className="field">
            {q.workType}
            <Choices options={L.workType} value={data.work_type} onChange={(v) => set("work_type", v)} />
          </div>
          <div className="field">
            {q.homeType}
            <Choices options={L.homeType} value={data.home_type} onChange={(v) => set("home_type", v)} />
          </div>
          <div className="field">
            {q.chimney} <span className="hint">{q.optional}</span>
            <Choices options={L.chimney} value={data.chimney} onChange={(v) => set("chimney", v)} />
          </div>
          <div className="field">
            {q.fuel} <span className="hint">{q.optional}</span>
            <Choices options={L.fuel} value={data.fuel} onChange={(v) => set("fuel", v)} />
          </div>
          <label className="field" style={{ maxWidth: 260 }}>
            {q.area} <span className="hint">{q.areaHint}</span>
            <input type="number" inputMode="numeric" min={5} max={2000} value={data.area_m2} onChange={(e) => set("area_m2", e.target.value)} />
          </label>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="step-body">
          <legend>{q.photosLegend}</legend>
          <p className="info-box">
            {q.photosInfo}
          </p>
          <div className="photo-grid">
            {photos.map((p, i) => (
              <figure key={p.url} className="photo-thumb">
                <img src={p.url} alt={fmt(q.photoAlt, { n: i + 1 })} />
                <button type="button" onClick={() => removePhoto(i)} aria-label={fmt(q.removePhoto, { n: i + 1 })}>×</button>
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
                {photoBusy ? q.preparing : photos.length ? q.morePhotos : q.addPhotos}
              </label>
            )}
          </div>
          <span className="hint">{fmt(q.photosCount, { n: photos.length, max: MAX_PHOTOS })}</span>
          <label className="field">
            {q.message} <span className="hint">{q.messageHint}</span>
            <textarea value={data.message} onChange={(e) => set("message", e.target.value)} maxLength={4000} style={{ minHeight: 90 }} />
          </label>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="step-body">
          <legend>{q.visitLegend}</legend>
          <p className="info-box">
            {q.visitInfoBefore} <strong>{q.visitInfoStrong}</strong>{q.visitInfoAfter}
          </p>
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
            {q.email} <span className="hint">{q.emailHint}</span>
            <input type="email" autoComplete="email" value={data.email} onChange={(e) => set("email", e.target.value)} maxLength={200} />
          </label>
          <div className="field" role="group" aria-label={q.address}>
            {q.address}
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
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("place", null)}>
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
                  <span className="hint">{q.orSearch}</span>
                </div>
              )}
              <PlaceSearch onSelect={(place) => choosePlace(place)} placeholder={q.addressPlaceholder} />
            </>
          )}
          <label className="field">
            {q.details} <span className="hint">{q.detailsHint}</span>
            <input value={data.address_details} onChange={(e) => set("address_details", e.target.value)} maxLength={200} />
          </label>

          <div className="row" style={{ alignItems: "flex-start" }}>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              {q.municipality} <span className="hint">{q.municipalityHint}</span>
              <select value={data.municipality} onChange={(e) => set("municipality", e.target.value)}>
                <option value="" disabled>{q.choose}</option>
                <optgroup label={q.freeVisit}>
                  {FREE_VISIT_MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
                </optgroup>
                <option value={OTHER_MUNICIPALITY}>{q.otherMunicipality}</option>
              </select>
            </label>
            {outside && (
              <label className="field" style={{ flex: 1, minWidth: 200 }}>
                {q.which}
                <input value={data.other_municipality} onChange={(e) => set("other_municipality", e.target.value)} maxLength={80} placeholder={q.whichPlaceholder} />
              </label>
            )}
          </div>
          {outside && (
            <p className="info-box">
              {q.outsideInfo}
            </p>
          )}
          <AvailabilityPicker value={data.availability} onChange={(v) => set("availability", v)} />

          <label className="field" style={{ maxWidth: 320 }}>
            {q.contactPref}
            <select value={data.contact_preference} onChange={(e) => set("contact_preference", e.target.value)}>
              {Object.keys(CONTACT_PREFERENCE).map((v) => <option key={v} value={v}>{L.contactPreference[v]}</option>)}
            </select>
          </label>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="step-body">
          <legend>{q.confirmLegend}</legend>
          <dl className="summary">
            <div><dt>{q.sumLooking}</dt><dd>{L.products[data.category]?.label ?? data.category}</dd></div>
            <div>
              <dt>{q.sumWork}</dt>
              <dd>
                {[L.workType[data.work_type], L.homeType[data.home_type], data.area_m2 && `${data.area_m2} m²`].filter(Boolean).join(" · ")}
              </dd>
            </div>
            {(data.chimney || data.fuel) && (
              <div>
                <dt>{q.sumDetails}</dt>
                <dd>{[data.chimney && fmt(q.sumChimney, { value: L.chimney[data.chimney].toLowerCase() }), L.fuel[data.fuel]].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
            <div><dt>{q.sumPhotos}</dt><dd>{photos.length ? (photos.length > 1 ? fmt(q.photosMany, { n: photos.length }) : q.photosOne) : q.noPhotos}</dd></div>
            <div><dt>{q.sumContact}</dt><dd>{data.name} · {data.phone}{data.email && ` · ${data.email}`}</dd></div>
            <div><dt>{q.sumAddress}</dt><dd>{data.place?.address}{data.address_details && ` (${data.address_details})`}{outside && data.other_municipality ? ` · ${data.other_municipality}` : ""}</dd></div>
            <div><dt>{q.sumAvailable}</dt><dd>{describeAvailability(data.availability, L)}</dd></div>
            <div><dt>{q.sumContactBy}</dt><dd>{L.contactPreference[data.contact_preference]}</dd></div>
          </dl>
          <p className="info-box">
            {q.notFinalBefore} <strong>{q.notFinalStrong}</strong>{q.notFinalAfter}
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
          <button className="btn btn-fire" disabled={pending || photoBusy}>
            {step < STEPS.length - 1 ? q.continue : pending ? q.sending : q.send}
          </button>
        )}
      </div>
    </form>
  );
}
