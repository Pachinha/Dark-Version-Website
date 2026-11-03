import {
  CONTACT_PREFERENCE,
  QUOTE_STATUS,
  WORK_TYPE,
  describeAvailability,
  formatDate,
  quoteRef,
} from "@/lib/labels";

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
export default function QuoteReceipt({ q, actions }: { q: ReceiptQuote; actions: React.ReactNode }) {
  const ref = quoteRef(q.ref);
  const step = PROGRESS.indexOf(q.status);
  const closed = step === -1; // recusado / cancelado

  return (
    <section className="panel">
      <span className="eyebrow">Comprovativo do pedido de orçamento</span>
      <div className="item-head" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{ref}</h1>
          <span className="muted">Pedido feito a {formatDate(q.created_at, true)}</span>
        </div>
        <span className="badge">{QUOTE_STATUS[q.status] ?? q.status}</span>
      </div>

      {!closed && (
        <ol className="progress" aria-label="Estado do pedido">
          {PROGRESS.map((s, i) => (
            <li key={s} className={i < step ? "progress-done" : i === step ? "progress-current" : ""}>
              <span />
              {QUOTE_STATUS[s]}
            </li>
          ))}
        </ol>
      )}

      {q.status === "visita_marcada" && q.visit_at && (
        <p className="info-box" style={{ marginBottom: 16 }}>
          <strong>Visita técnica marcada para {formatDate(q.visit_at, true)}.</strong>
        </p>
      )}

      <dl className="summary">
        <div><dt>Nome</dt><dd>{q.name}</dd></div>
        <div><dt>Procura</dt><dd>{[q.category, q.work_type && WORK_TYPE[q.work_type]].filter(Boolean).join(" · ")}</dd></div>
        <div><dt>Concelho</dt><dd>{q.municipality || "—"}</dd></div>
        <div><dt>Disponibilidade</dt><dd>{describeAvailability(q.availability)}</dd></div>
        <div><dt>Contacto</dt><dd>{CONTACT_PREFERENCE[q.contact_preference] ?? "—"}</dd></div>
        <div><dt>Fotos</dt><dd>{q.photos?.length ? `${q.photos.length} enviada${q.photos.length > 1 ? "s" : ""}` : "Nenhuma"}</dd></div>
      </dl>

      {q.admin_reply && (
        <div className="reply">
          <strong>Mensagem da Lareiras Pachinha:</strong>
          <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{q.admin_reply}</p>
        </div>
      )}

      <p className="muted" style={{ margin: "18px 0 0" }}>
        Este documento comprova que o pedido foi recebido pela Lareiras Pachinha. Não é um orçamento: o orçamento é
        enviado depois da visita técnica.
      </p>

      <div className="row no-print" style={{ marginTop: 18 }}>
        {actions}
      </div>
    </section>
  );
}
