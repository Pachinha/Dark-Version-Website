import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateMaintenance } from "@/app/actions/admin";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import History from "@/components/admin/History";
import ClientCard from "@/components/admin/ClientCard";
import LocationRequest from "@/components/admin/LocationRequest";
import AvailabilityTable from "@/components/admin/AvailabilityTable";
import {
  CONTACT_PREFERENCE,
  MAINTENANCE_SERVICE,
  MAINTENANCE_STATUS,
  URGENCY,
  formatDate,
  toLocalInput,
} from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminMaintenanceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";
  const { id } = await params;
  const supabase = await createClient();

  const { data: m } = await supabase
    .from("maintenance_requests")
    .select("*, client:profiles!maintenance_requests_user_id_fkey(id, full_name, email, phone), addresses(*)")
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  // Registo de um cliente sem conta (criado pela administração): contactos e morada no próprio registo.
  const client = m.client ? { ...m.client, id: m.customer_id ?? m.client.id } : m.name ? { id: m.customer_id ?? "", full_name: m.name, email: m.email, phone: m.phone } : null;
  const address = m.addresses ?? (m.address ? { label: "Morada", address: m.address, details: m.address_details, lat: m.lat, lng: m.lng } : null);

  const { data: staff } = isAdmin
    ? await supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name")
    : { data: [] };

  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={panel("/manutencao")} className="tab">← Limpezas & manutenções</Link>
      </p>
      <div className="grid-2">
        <section className="panel">
          <span className="eyebrow">{MAINTENANCE_STATUS[m.status]}</span>
          <h2>{MAINTENANCE_SERVICE[m.service]}</h2>
          <p style={{ marginTop: 0 }}><strong>Equipamento:</strong> {m.equipment}</p>
          <p className="muted">Pedido a {formatDate(m.created_at, true)}</p>
          {m.notes && <p className="reply" style={{ whiteSpace: "pre-wrap" }}>{m.notes}</p>}

          <h3 style={{ fontSize: 15, margin: "20px 0 8px" }}>Preferências do cliente</h3>
          <dl className="summary">
            <div>
              <dt>Urgência</dt>
              <dd>
                <span className={`pref${m.urgency === "urgente" ? " pref-urgente" : ""}`}>{URGENCY[m.urgency]?.label}</span>{" "}
                <span className="hint">{URGENCY[m.urgency]?.hint}</span>
              </dd>
            </div>
            <div>
              <dt>Disponibilidade</dt>
              <dd>
                <AvailabilityTable slots={m.availability} />
              </dd>
            </div>
            <div><dt>A partir de</dt><dd>{m.preferred_date ? formatDate(m.preferred_date) : "Sem restrição"}</dd></div>
            <div><dt>Contactar por</dt><dd>{CONTACT_PREFERENCE[m.contact_preference] ?? "—"}</dd></div>
          </dl>

          <h3 style={{ fontSize: 15, margin: "20px 0 8px" }}>Gerir</h3>
          <ConfirmedForm
            action={updateMaintenance}
            labels={{
              status: "Estado",
              scheduled_for: "Data da visita",
              duration_minutes: "Duração",
              technician_id: "Técnico",
              admin_notes: "Nota para o cliente",
            }}
          >
            <input type="hidden" name="id" value={m.id} />
            <label className="field">
              Estado
              <select name="status" defaultValue={m.status}>
                {Object.entries(MAINTENANCE_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            {isAdmin && (
              <>
                <div className="row" style={{ alignItems: "flex-end" }}>
                  <label className="field" style={{ flex: 2, minWidth: 200 }}>
                    Data e hora da visita
                    <input type="datetime-local" name="scheduled_for" defaultValue={toLocalInput(m.scheduled_for)} />
                  </label>
                  <label className="field" style={{ flex: 1, minWidth: 120 }}>
                    Duração
                    <select name="duration_minutes" defaultValue={String(m.duration_minutes)}>
                      {[30, 60, 90, 120, 180, 240, 480].map((n) => (
                        <option key={n} value={n}>{n < 60 ? `${n} min` : `${n / 60} h`}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="field">
                  Técnico
                  <select name="technician_id" defaultValue={m.technician_id ?? ""}>
                    <option value="">— Sem técnico —</option>
                    {staff?.map((s) => <option key={s.id} value={s.id}>{s.full_name || "(sem nome)"}</option>)}
                  </select>
                </label>
              </>
            )}
            <label className="field">
              Nota para o cliente
              <input name="admin_notes" defaultValue={m.admin_notes ?? ""} />
            </label>
          </ConfirmedForm>
        </section>

        <ClientCard client={client} address={address} linkToClient={isAdmin && Boolean(m.customer_id || m.client)}>
          {isAdmin && <LocationRequest entity="maintenance_requests" id={m.id} hasLocation={Boolean(address)} />}
        </ClientCard>
      </div>
      <div style={{ marginTop: 20 }}>
        <History entityId={m.id} />
      </div>
    </>
  );
}
