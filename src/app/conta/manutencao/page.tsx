import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE_SERVICE, MAINTENANCE_STATUS, URGENCY, describeAvailability, formatDate } from "@/lib/labels";

export default async function ManutencaoContaPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  // Pedidos feitos sem conta, com o mesmo email (já confirmado), passam para esta conta.
  await supabase.rpc("claim_guest_quotes");
  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select("*, addresses(label, address)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <section className="panel">
        <span className="eyebrow">Novo pedido</span>
        <h2>Pedir manutenção ou limpeza</h2>
        <p className="muted">
          Escolha o serviço, o equipamento e quando lhe dá mais jeito. Os seus contactos e moradas guardadas já
          vêm preenchidos.
        </p>
        <Link href="/pedir-servico" className="btn btn-fire">Fazer um pedido</Link>
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
                  {m.addresses ? `${m.addresses.label} — ${m.addresses.address}` : m.address || "Morada removida"}
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
