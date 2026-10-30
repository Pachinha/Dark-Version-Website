import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  JOB_STATUS,
  MAINTENANCE_SERVICE,
  MAINTENANCE_STATUS,
  ORDER_STATUS,
  QUOTE_STATUS,
  formatDate,
} from "@/lib/labels";

export default async function ContaPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  // Pedidos feitos sem conta, com o mesmo email (já confirmado), passam para esta conta.
  await supabase.rpc("claim_guest_quotes");

  const [quotes, maintenance, orders, jobs] = await Promise.all([
    supabase.from("quote_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("maintenance_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("orders").select("*").eq("user_id", user.id).order("order_date", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_start, scheduled_end, client_notes")
      .eq("user_id", user.id)
      .neq("status", "cancelado")
      .order("scheduled_start", { ascending: false, nullsFirst: true }),
  ]);

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Orçamentos recentes</h2>
        {quotes.data?.length ? (
          <ul className="list">
            {quotes.data.map((q) => (
              <li key={q.id} className="item">
                <div className="item-head">
                  <strong>{q.category}</strong>
                  <span className="badge">{QUOTE_STATUS[q.status]}</span>
                </div>
                <span className="muted">{formatDate(q.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Ainda não pediu nenhum orçamento.</p>
        )}
        <p style={{ marginBottom: 0 }}>
          <Link href="/pedir-orcamento" className="btn btn-fire btn-sm">Pedir orçamento</Link>
        </p>
      </section>

      <section className="panel">
        <h2>Manutenções</h2>
        {maintenance.data?.length ? (
          <ul className="list">
            {maintenance.data.map((m) => (
              <li key={m.id} className="item">
                <div className="item-head">
                  <strong>{MAINTENANCE_SERVICE[m.service]}</strong>
                  <span className="badge">{MAINTENANCE_STATUS[m.status]}</span>
                </div>
                <span className="muted">
                  {m.scheduled_for ? `Visita marcada para ${formatDate(m.scheduled_for, true)}` : m.equipment}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Sem pedidos de manutenção.</p>
        )}
        <p style={{ marginBottom: 0 }}>
          <Link href="/conta/manutencao" className="btn btn-fire btn-sm">Pedir manutenção</Link>
        </p>
      </section>

      {jobs.data?.length ? (
        <section className="panel" style={{ gridColumn: "1 / -1" }}>
          <h2>As minhas obras</h2>
          <ul className="list">
            {jobs.data.map((j) => (
              <li key={j.id} className="item">
                <div className="item-head">
                  <strong>{j.title}</strong>
                  <span className="badge">{JOB_STATUS[j.status]}</span>
                </div>
                <span className="muted">
                  {j.scheduled_start
                    ? `Início: ${formatDate(j.scheduled_start, true)}${j.scheduled_end ? ` · Fim previsto: ${formatDate(j.scheduled_end)}` : ""}`
                    : "A aguardar agendamento"}
                </span>
                {j.client_notes && <div className="reply">{j.client_notes}</div>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h2>As minhas encomendas</h2>
        {orders.data?.length ? (
          <ul className="list">
            {orders.data.map((o) => (
              <li key={o.id} className="item">
                <div className="item-head">
                  <strong>{o.description}</strong>
                  <span className="badge">{ORDER_STATUS[o.status]}</span>
                </div>
                <span className="muted">{formatDate(o.order_date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            Quando fizer uma compra ou instalação connosco, aparece aqui.
          </p>
        )}
      </section>
    </div>
  );
}
