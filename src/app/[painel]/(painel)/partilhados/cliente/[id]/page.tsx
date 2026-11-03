import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePanel } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Comments from "@/components/admin/Comments";
import Directions from "@/components/admin/Directions";
import { JOB_STATUS, MAINTENANCE_SERVICE, MAINTENANCE_STATUS, QUOTE_STATUS, formatDate } from "@/lib/labels";
import { whatsappNumber } from "@/lib/notify";
import { panel } from "@/lib/panel";

// Ficha de cliente partilhada — só leitura. A base de dados (RLS) só devolve os dados
// se este cliente tiver sido partilhado com quem está a ver (ou se for administrador).
export default async function SharedClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requirePanel();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("profiles").select("id, full_name, email, phone, role").eq("id", id).eq("role", "client").maybeSingle();
  if (!client) notFound();

  const [addresses, quotes, maintenance, jobs] = await Promise.all([
    supabase.from("addresses").select("id, label, address, details, lat, lng").eq("user_id", id).order("created_at"),
    supabase.from("quote_requests").select("id, category, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("maintenance_requests").select("id, service, status, created_at, scheduled_for").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("jobs").select("id, title, status, scheduled_start, created_at").eq("user_id", id).order("created_at", { ascending: false }),
  ]);
  const wa = whatsappNumber(client.phone ?? "");

  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={panel("/partilhados")} className="tab">← Partilhados comigo</Link>
      </p>
      <div className="grid-2">
        <section className="panel">
          <span className="eyebrow">Cliente · só consulta</span>
          <h2>{client.full_name || "(sem nome)"}</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            {client.phone && <><a className="link" href={`tel:${client.phone}`}>{client.phone}</a><br /></>}
            <a className="link" href={`mailto:${client.email}`}>{client.email}</a>
          </p>
          <div className="row">
            {client.phone && <a className="btn btn-ink btn-sm" href={`tel:${client.phone}`}>Ligar</a>}
            {wa && <a className="btn btn-whatsapp btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>

          <h2 style={{ marginTop: 24 }}>Histórico</h2>
          <ul className="list" style={{ gap: 6 }}>
            {quotes.data?.map((q) => (
              <li key={q.id} className="muted">
                {formatDate(q.created_at)} —{" "}
                <Link className="link" href={panel(`/partilhados/pedido/${q.id}`)}>Orçamento {q.category}</Link>: {QUOTE_STATUS[q.status]}
              </li>
            ))}
            {maintenance.data?.map((m) => (
              <li key={m.id} className="muted">
                {formatDate(m.scheduled_for ?? m.created_at)} — {MAINTENANCE_SERVICE[m.service]}: {MAINTENANCE_STATUS[m.status]}
              </li>
            ))}
            {jobs.data?.map((j) => (
              <li key={j.id} className="muted">
                {formatDate(j.scheduled_start ?? j.created_at)} — Obra: {j.title}: {JOB_STATUS[j.status]}
              </li>
            ))}
            {!quotes.data?.length && !maintenance.data?.length && !jobs.data?.length && <li className="muted">Sem histórico.</li>}
          </ul>
        </section>

        <section className="panel">
          <h2>Moradas</h2>
          {addresses.data?.length ? (
            <ul className="list">
              {addresses.data.map((a) => (
                <li key={a.id} className="item">
                  <strong>{a.label}</strong>
                  <div>{a.address}</div>
                  {a.details && <div className="muted">{a.details}</div>}
                  <div style={{ marginTop: 8 }}>
                    <Directions address={a.address} lat={a.lat} lng={a.lng} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ marginBottom: 0 }}>Sem moradas guardadas.</p>
          )}
        </section>
      </div>

      <div style={{ marginTop: 20 }}>
        <Comments clientId={client.id} isAdmin={profile.role === "admin"} />
      </div>
    </>
  );
}
