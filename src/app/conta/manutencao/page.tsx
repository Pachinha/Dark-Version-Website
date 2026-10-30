import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE_SERVICE, MAINTENANCE_STATUS, URGENCY, describeAvailability, formatDate } from "@/lib/labels";
import MaintenanceForm from "./MaintenanceForm";

export default async function ManutencaoContaPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const [{ data: addresses }, { data: requests }] = await Promise.all([
    supabase.from("addresses").select("id, label, address, details").eq("user_id", user.id).order("created_at"),
    supabase
      .from("maintenance_requests")
      .select("*, addresses(label, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <section className="panel">
        <span className="eyebrow">Novo pedido</span>
        <h2>Pedir manutenção ou limpeza</h2>
        {addresses?.length ? (
          <MaintenanceForm addresses={addresses} needsPhone={!profile.phone} />
        ) : (
          <>
            <p className="muted">
              Para o técnico chegar a sua casa, precisamos primeiro de uma morada. Pode partilhar a sua
              localização ou pesquisar a morada.
            </p>
            <Link href="/conta/moradas" className="btn btn-fire">Adicionar morada</Link>
          </>
        )}
      </section>
      <section className="panel">
        <h2>Os meus pedidos</h2>
        {requests?.length ? (
          <ul className="list">
            {requests.map((m) => (
              <li key={m.id} className="item">
                <div className="item-head">
                  <strong>{MAINTENANCE_SERVICE[m.service]}</strong>
                  <span className="badge">{MAINTENANCE_STATUS[m.status]}</span>
                </div>
                <div>{m.equipment}</div>
                <div className="muted">
                  {m.addresses ? `${m.addresses.label} — ${m.addresses.address}` : "Morada removida"}
                </div>
                {m.scheduled_for ? (
                  <div><strong>Visita marcada para {formatDate(m.scheduled_for, true)}</strong></div>
                ) : m.status === "pendente" ? (
                  <div className="prefs">
                    <span className={`pref${m.urgency === "urgente" ? " pref-urgente" : ""}`}>{URGENCY[m.urgency]?.label}</span>
                    <span className="pref">{describeAvailability(m.availability)}</span>
                    {m.preferred_date && <span className="pref">A partir de {formatDate(m.preferred_date)}</span>}
                  </div>
                ) : null}
                {m.admin_notes && <div className="reply">{m.admin_notes}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>Sem pedidos de manutenção.</p>
        )}
      </section>
    </>
  );
}
