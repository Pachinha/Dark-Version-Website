import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS, WORK_TYPE, formatDate, quoteRef } from "@/lib/labels";

export default async function OrcamentosPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  // Pedidos feitos sem conta, com o mesmo email (já confirmado), passam para esta conta.
  await supabase.rpc("claim_guest_quotes");
  const { data: quotes } = await supabase
    .from("quote_requests")
    .select("id, ref, category, work_type, municipality, status, visit_at, message, admin_reply, photos, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="panel">
      <div className="item-head" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Os meus pedidos de orçamento</h2>
        <Link href="/pedir-orcamento" className="btn btn-fire btn-sm">Novo pedido</Link>
      </div>
      {quotes?.length ? (
        <ul className="list">
          {quotes.map((q) => (
            <li key={q.id} className="item">
              <div className="item-head">
                <strong>{q.category}{q.work_type && ` · ${WORK_TYPE[q.work_type]}`}</strong>
                <span className="badge">{QUOTE_STATUS[q.status] ?? q.status}</span>
              </div>
              <span className="muted">
                <Link className="link" href={`/pedido/${q.id}`}>{quoteRef(q.ref)}</Link> · Pedido a {formatDate(q.created_at)}
                {q.municipality && ` · ${q.municipality}`}
                {q.photos?.length > 0 && ` · ${q.photos.length} foto${q.photos.length > 1 ? "s" : ""}`}
              </span>
              {q.status === "visita_marcada" && q.visit_at && (
                <p style={{ margin: "8px 0 0" }}><strong>Visita técnica marcada para {formatDate(q.visit_at, true)}</strong></p>
              )}
              {q.message && <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{q.message}</p>}
              {q.admin_reply && (
                <div className="reply">
                  <strong>Resposta da Pachinha:</strong>
                  <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{q.admin_reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Ainda não fez nenhum pedido.</p>
      )}
    </section>
  );
}
