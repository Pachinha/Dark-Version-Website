import { describeAvailability, formatDate, quoteRef } from "@/lib/labels";
import { LOCALE_TAGS, fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

const PROGRESS = ["novo", "visita_marcada", "visita_feita", "orcamento_enviado", "em_obra"];

export type ReceiptQuote = {
  ref: number;
  created_at: string;
  status: string;
  name: string;
  category: string;
  work_type: string | null;
  municipality: string | null;
  availability: string[] | null;
  contact_preference: string;
  photos: string[] | null;
  visit_at: string | null;
  admin_reply: string | null;
};

export const RECEIPT_COLUMNS =
  "id, ref, created_at, status, name, category, work_type, municipality, availability, contact_preference, photos, visit_at, admin_reply";

// Conteúdo do comprovativo do pedido — o mesmo para o cliente (/pedido/[id]) e para o painel.
// Cada página põe os seus próprios botões em "actions" (o cliente volta ao site, a equipa ao pedido).
// No painel a língua é sempre o português; no site, a da página.
export default async function QuoteReceipt({ q, actions }: { q: ReceiptQuote; actions: React.ReactNode }) {
  const { locale, t } = await getI18n();
  const r = t.receipt;
  const L = t.labels;
  const date = (value: string | null, withTime = false) => formatDate(value, withTime, LOCALE_TAGS[locale]);
  const ref = quoteRef(q.ref);
  const step = PROGRESS.indexOf(q.status);
  const closed = step === -1; // recusado / cancelado

  return (
    <section className="panel">
      <span className="eyebrow">{r.eyebrow}</span>
      <div className="item-head" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{ref}</h1>
          <span className="muted">{fmt(r.madeOn, { date: date(q.created_at, true) })}</span>
        </div>
        <span className="badge">{L.status[q.status] ?? q.status}</span>
      </div>

      {!closed && (
        <ol className="progress" aria-label={r.progressAria}>
          {PROGRESS.map((s, i) => (
            <li key={s} className={i < step ? "progress-done" : i === step ? "progress-current" : ""}>
              <span />
              {L.status[s]}
            </li>
          ))}
        </ol>
      )}

      {q.status === "visita_marcada" && q.visit_at && (
        <p className="info-box" style={{ marginBottom: 16 }}>
          <strong>{fmt(r.visitBooked, { date: date(q.visit_at, true) })}</strong>
        </p>
      )}

      <dl className="summary">
        <div><dt>{r.name}</dt><dd>{q.name}</dd></div>
        <div><dt>{r.looking}</dt><dd>{[L.products[q.category]?.label ?? q.category, q.work_type && L.workType[q.work_type]].filter(Boolean).join(" · ")}</dd></div>
        <div><dt>{r.municipality}</dt><dd>{q.municipality || "—"}</dd></div>
        <div><dt>{r.availability}</dt><dd>{describeAvailability(q.availability, L)}</dd></div>
        <div><dt>{r.contact}</dt><dd>{L.contactPreference[q.contact_preference] ?? "—"}</dd></div>
        <div><dt>{r.photos}</dt><dd>{q.photos?.length ? (q.photos.length > 1 ? fmt(r.photosMany, { n: q.photos.length }) : r.photosOne) : r.none}</dd></div>
      </dl>

      {q.admin_reply && (
        <div className="reply">
          <strong>{r.message}</strong>
          <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{q.admin_reply}</p>
        </div>
      )}

      <p className="muted" style={{ margin: "18px 0 0" }}>
        {r.disclaimer}
      </p>

      <div className="row no-print" style={{ marginTop: 18 }}>
        {actions}
      </div>
    </section>
  );
}
