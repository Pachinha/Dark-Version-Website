import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StatusFilters from "@/components/admin/StatusFilters";
import { MAINTENANCE_SERVICE, MAINTENANCE_STATUS, URGENCY, describeAvailability, formatDate, one } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminMaintenanceList({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireStaff();
  const { estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("maintenance_requests")
    .select("id, service, equipment, status, scheduled_for, preferred_date, availability, urgency, created_at, client:profiles!maintenance_requests_user_id_fkey(full_name), tech:profiles!maintenance_requests_technician_id_fkey(full_name), addresses(locality)")
    .order("scheduled_for", { ascending: true, nullsFirst: true })
    .limit(300);
  if (estado && estado in MAINTENANCE_STATUS) query = query.eq("status", estado);
  const { data: rows } = await query;

  return (
    <section className="panel">
      <h2>Limpezas & manutenções</h2>
      <StatusFilters statuses={MAINTENANCE_STATUS} active={estado} />
      {rows?.length ? (
        <ul className="list">
          {rows.map((m) => (
            <li key={m.id}>
              <Link href={panel(`/manutencao/${m.id}`)} className="item" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div className="item-head">
                  <strong>{MAINTENANCE_SERVICE[m.service]} — {one(m.client)?.full_name}</strong>
                  <span className="row" style={{ gap: 6 }}>
                    {m.status === "pendente" && m.urgency === "urgente" && <span className="pref pref-urgente">Urgente</span>}
                    <span className="badge">{MAINTENANCE_STATUS[m.status]}</span>
                  </span>
                </div>
                <div className="muted">
                  {m.equipment}
                  {one(m.addresses)?.locality && ` · ${one(m.addresses)!.locality}`}
                  {" · "}
                  {m.scheduled_for
                    ? `Agendado: ${formatDate(m.scheduled_for, true)}`
                    : `Prefere: ${describeAvailability(m.availability)}${m.preferred_date ? ` (a partir de ${formatDate(m.preferred_date)})` : ""} · ${URGENCY[m.urgency]?.label}`}
                  {one(m.tech)?.full_name && ` · Técnico: ${one(m.tech)!.full_name}`}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Sem pedidos.</p>
      )}
    </section>
  );
}
