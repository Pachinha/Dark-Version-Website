import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createOrder, updateOrderStatus } from "@/app/actions/admin";
import { updateCustomer } from "@/app/actions/customers";
import ActionForm from "@/components/account/ActionForm";
import Comments from "@/components/admin/Comments";
import Directions from "@/components/admin/Directions";
import SharePanel from "@/components/admin/SharePanel";
import PhoneInput from "@/components/PhoneInput";
import { customerDuplicates, customerHistory, customerPlaces, getCustomer, type HistoryItem } from "@/lib/customers";
import { JOB_STATUS, MAINTENANCE_SERVICE, MAINTENANCE_STATUS, ORDER_STATUS, QUOTE_STATUS, formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

const HISTORY: Record<HistoryItem["kind"], { href: (id: string) => string; label: (h: HistoryItem) => string; status: Record<string, string> }> = {
  orcamento: { href: (id) => `/orcamentos/${id}`, label: (h) => `Orçamento ${h.title}`, status: QUOTE_STATUS },
  manutencao: { href: (id) => `/manutencao/${id}`, label: (h) => MAINTENANCE_SERVICE[h.title] ?? h.title, status: MAINTENANCE_STATUS },
  obra: { href: (id) => `/obras/${id}`, label: (h) => `Obra: ${h.title}`, status: JOB_STATUS },
};

export default async function AdminClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ juntado?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { juntado } = await searchParams;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const userId = customer.user_id;
  const supabase = await createClient();

  const [history, places, duplicates, profile, addresses, orders] = await Promise.all([
    customerHistory(customer.id),
    customerPlaces(customer.id),
    customerDuplicates(),
    userId ? supabase.from("profiles").select("*").eq("id", userId).maybeSingle().then((r) => r.data) : null,
    userId ? supabase.from("addresses").select("*").eq("user_id", userId).order("created_at").then((r) => r.data) : null,
    userId ? supabase.from("orders").select("*").eq("user_id", userId).order("order_date", { ascending: false }).then((r) => r.data) : null,
  ]);
  const possibleDuplicates = duplicates.filter((d) => d.a === customer.id || d.b === customer.id).length;
  const name = profile?.full_name || customer.name || "(sem nome)";
  const email = profile?.email || customer.email;
  const phone = profile?.phone || customer.phone;
  const anonymousRequests = userId ? history.filter((h) => !h.withAccount).length : 0;

  return (
    <>
      {juntado && <p className="info-box" style={{ margin: "0 0 16px" }}>✓ Fichas juntadas. Todos os pedidos estão agora nesta ficha.</p>}
      <section className="panel">
        <span className="eyebrow">{userId ? "Cliente com conta no site" : "Cliente sem conta"}</span>
        <h2>{name}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {[email, phone].filter(Boolean).join(" · ") || "Sem contactos"} · cliente desde {formatDate(profile?.created_at ?? customer.created_at)}
          {profile && (
            <>
              <br />
              Marketing: {profile.marketing_opt_in ? "aceita" : "não aceita — não enviar promoções"}
            </>
          )}
        </p>
        {possibleDuplicates > 0 && (
          <p className="info-box" style={{ margin: "12px 0 0" }}>
            ⚠ Há {possibleDuplicates === 1 ? "outra ficha parecida" : `${possibleDuplicates} fichas parecidas`} (mesmo nome ou morada).{" "}
            <Link className="link" href={panel("/clientes/repetidos")}>Ver e decidir</Link>
          </p>
        )}
        {anonymousRequests > 0 && (
          <p className="hint" style={{ margin: "12px 0 0" }}>
            {anonymousRequests === 1 ? "1 pedido foi feito" : `${anonymousRequests} pedidos foram feitos`} sem sessão iniciada, com o mesmo
            telefone ou email. Aparece{anonymousRequests === 1 ? "" : "m"} só aqui no painel, não na área de cliente.
          </p>
        )}
        <p className="row" style={{ margin: "16px 0 0" }}>
          <Link className="btn btn-fire btn-sm" href={panel(`/novo?cliente=${customer.id}`)}>+ Novo registo</Link>
          {userId && <Link className="btn btn-ghost btn-sm" href={panel(`/obras/nova?cliente=${userId}`)}>+ Nova obra</Link>}
        </p>
      </section>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <section className="panel">
          <h2>Ficha</h2>
          <ActionForm action={updateCustomer}>
            <input type="hidden" name="id" value={customer.id} />
            {userId ? (
              <p className="hint" style={{ margin: 0 }}>
                Nome e contactos vêm da conta do cliente — ele altera-os na área de cliente.
              </p>
            ) : (
              <>
                <label className="field">
                  Nome
                  <input name="name" defaultValue={customer.name} required maxLength={120} />
                </label>
                <div className="field">
                  Telefone
                  <PhoneInput name="phone" defaultValue={customer.phone} />
                </div>
                <label className="field">
                  Email
                  <input name="email" type="email" defaultValue={customer.email} maxLength={200} />
                </label>
              </>
            )}
            {userId && <input type="hidden" name="name" value={name} />}
            <label className="field">
              Notas internas <span className="hint">Só a administração vê</span>
              <textarea name="notes" defaultValue={customer.notes} rows={4} maxLength={4000} />
            </label>
          </ActionForm>

          <h2 style={{ marginTop: 28 }}>Moradas</h2>
          {addresses?.length || places.length ? (
            <ul className="list">
              {addresses?.map((a) => (
                <li key={a.id} className="item">
                  <strong>{a.label}</strong> <span className="badge">{a.source === "gps" ? "GPS" : "Pesquisa"}</span>
                  <div>{a.address}</div>
                  {a.details && <div className="muted">{a.details}</div>}
                  <Directions address={a.address} lat={a.lat} lng={a.lng} compact />
                </li>
              ))}
              {places
                .filter((p) => !addresses?.some((a) => a.address.trim().toLowerCase() === p.address.trim().toLowerCase()))
                .map((p) => (
                  <li key={`${p.address}|${p.details}`} className="item">
                    <strong>Morada de um pedido</strong>
                    <div>{p.address}</div>
                    {p.details && <div className="muted">{p.details}</div>}
                    <Directions address={p.address} lat={p.lat} lng={p.lng} compact />
                  </li>
                ))}
            </ul>
          ) : (
            <p className="muted">Sem moradas.</p>
          )}
        </section>

        <section className="panel">
          <h2>Histórico</h2>
          {history.length ? (
            <ul className="list" style={{ gap: 6 }}>
              {history.map((h) => {
                const kind = HISTORY[h.kind];
                return (
                  <li key={`${h.kind}-${h.id}`} className="muted">
                    {formatDate(h.date)} — <Link className="link" href={panel(kind.href(h.id))}>{kind.label(h)}</Link>: {kind.status[h.status] ?? h.status}
                    {userId && !h.withAccount && <span className="pref" style={{ marginLeft: 6 }}>sem sessão</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Sem pedidos.</p>
          )}

          {userId && (
            <>
              <h2 style={{ marginTop: 28 }}>Encomendas</h2>
              {orders?.length ? (
                <ul className="list" style={{ marginBottom: 20 }}>
                  {orders.map((o) => (
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
                <input type="hidden" name="user_id" value={userId} />
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
            </>
          )}
        </section>
      </div>

      {userId && (
        <div className="grid-2" style={{ marginTop: 20 }}>
          <Comments clientId={userId} isAdmin />
          <SharePanel clientId={userId} />
        </div>
      )}
    </>
  );
}
