import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createOrder, updateOrderStatus } from "@/app/actions/admin";
import ActionForm from "@/components/account/ActionForm";
import Comments from "@/components/admin/Comments";
import Directions from "@/components/admin/Directions";
import SharePanel from "@/components/admin/SharePanel";
import { JOB_STATUS, MAINTENANCE_SERVICE, MAINTENANCE_STATUS, ORDER_STATUS, QUOTE_STATUS, formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();

  const [addresses, orders, quotes, maintenance, jobs] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", id).order("created_at"),
    supabase.from("orders").select("*").eq("user_id", id).order("order_date", { ascending: false }),
    supabase.from("quote_requests").select("id, category, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("maintenance_requests").select("id, service, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("jobs").select("id, title, status, scheduled_start, created_at").eq("user_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <section className="panel">
        <h2>{client.full_name || "(sem nome)"}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {client.email}{client.phone && ` · ${client.phone}`} · cliente desde {formatDate(client.created_at)}
          <br />
          Marketing: {client.marketing_opt_in ? "aceita" : "não aceita — não enviar promoções"}
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link className="btn btn-fire btn-sm" href={panel(`/obras/nova?cliente=${client.id}`)}>+ Nova obra</Link>
        </p>
      </section>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <section className="panel">
          <h2>Encomendas</h2>
          {orders.data?.length ? (
            <ul className="list" style={{ marginBottom: 20 }}>
              {orders.data.map((o) => (
                <li key={o.id} className="item">
                  <div className="item-head">
                    <strong>{o.description}</strong>
                    <span className="muted">{formatDate(o.order_date)}</span>
                  </div>
                  <form action={updateOrderStatus} className="row" style={{ marginTop: 8 }}>
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.status} className="btn btn-ghost btn-sm" aria-label="Estado">
                      {Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <button className="btn btn-ink btn-sm">Atualizar</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sem encomendas.</p>
          )}
          <h3 style={{ fontSize: 15, marginBottom: 0 }}>Registar encomenda</h3>
          <ActionForm action={createOrder} submitLabel="Registar">
            <input type="hidden" name="user_id" value={id} />
            <label className="field">
              Descrição
              <input name="description" placeholder="Ex.: Recuperador Solzaima Douro + instalação" required />
            </label>
            <div className="row">
              <label className="field">
                Data
                <input type="date" name="order_date" />
              </label>
              <label className="field">
                Estado
                <select name="status" defaultValue="encomendado">
                  {Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
          </ActionForm>
        </section>

        <section className="panel">
          <h2>Moradas</h2>
          {addresses.data?.length ? (
            <ul className="list">
              {addresses.data.map((a) => (
                <li key={a.id} className="item">
                  <strong>{a.label}</strong> <span className="badge">{a.source === "gps" ? "GPS" : "Pesquisa"}</span>
                  <div>{a.address}</div>
                  {a.details && <div className="muted">{a.details}</div>}
                  <Directions address={a.address} lat={a.lat} lng={a.lng} compact />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sem moradas.</p>
          )}

          <h2 style={{ marginTop: 28 }}>Histórico</h2>
          <ul className="list" style={{ gap: 6 }}>
            {quotes.data?.map((q) => (
              <li key={q.id} className="muted">
                {formatDate(q.created_at)} — Orçamento {q.category}: {QUOTE_STATUS[q.status]}
              </li>
            ))}
            {maintenance.data?.map((m) => (
              <li key={m.id} className="muted">
                {formatDate(m.created_at)} —{" "}
                <Link className="link" href={panel(`/manutencao/${m.id}`)}>{MAINTENANCE_SERVICE[m.service]}</Link>: {MAINTENANCE_STATUS[m.status]}
              </li>
            ))}
            {jobs.data?.map((j) => (
              <li key={j.id} className="muted">
                {formatDate(j.scheduled_start ?? j.created_at)} —{" "}
                <Link className="link" href={panel(`/obras/${j.id}`)}>Obra: {j.title}</Link>: {JOB_STATUS[j.status]}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Comments clientId={id} isAdmin />
        <SharePanel clientId={id} />
      </div>
    </>
  );
}
