import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { customerDuplicates, requestCounts, type Customer } from "@/lib/customers";
import { formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

// Todas as fichas de cliente — com conta no site ou sem conta (pedidos feitos sem login,
// clientes da loja/telefone). As fichas são criadas e ligadas automaticamente (supabase/016).
export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, user_id, name, phone, email, created_at, updated_at, profiles!customers_user_id_fkey(role, marketing_opt_in)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (q) {
    const term = q.replace(/[%,()*]/g, " ").trim();
    const digits = term.replace(/\D/g, "");
    query = query.or(
      [`name.ilike.%${term}%`, `email.ilike.%${term}%`, `phone.ilike.%${term}%`, digits.length >= 3 && `phone_key.ilike.%${digits}%`]
        .filter(Boolean)
        .join(","),
    );
  }
  type Row = Pick<Customer, "id" | "user_id" | "name" | "phone" | "email" | "created_at"> & {
    profiles: { role: string; marketing_opt_in: boolean } | null;
  };
  const [{ data }, duplicates] = await Promise.all([query.returns<Row[]>(), customerDuplicates()]);
  // A equipa (admin/técnicos) não aparece como cliente.
  const customers = (data ?? []).filter((c) => !c.profiles || c.profiles.role === "client");
  const counts = await requestCounts(customers.map((c) => c.id));

  return (
    <section className="panel">
      <h2>Clientes</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Cada cliente tem uma ficha, com ou sem conta no site. Quem volta a pedir com o mesmo telefone ou email
        entra automaticamente na ficha que já existe.
      </p>
      {duplicates.length > 0 && (
        <p className="info-box" style={{ margin: "0 0 16px" }}>
          <strong>⚠ {duplicates.length === 1 ? "1 possível cliente repetido" : `${duplicates.length} possíveis clientes repetidos`}</strong>{" "}
          — mesmo nome ou mesma morada, mas com contactos diferentes.{" "}
          <Link className="link" href={panel("/clientes/repetidos")}>Ver e decidir</Link>
        </p>
      )}
      <form className="row" style={{ marginBottom: 16 }}>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          <span className="hint">Pesquisar por nome, email ou telefone</span>
          <input name="q" defaultValue={q} />
        </label>
        <button className="btn btn-ink btn-sm" style={{ alignSelf: "flex-end", marginBottom: 4 }}>Pesquisar</button>
      </form>
      {customers.length ? (
        <ul className="list">
          {customers.map((c) => {
            const n = counts.get(c.id) ?? 0;
            return (
              <li key={c.id} className="item">
                <div className="item-head">
                  <Link className="link" href={panel(`/clientes/${c.id}`)}><strong>{c.name || "(sem nome)"}</strong></Link>
                  <span className="row" style={{ gap: 6 }}>
                    <span className="badge">{c.user_id ? "Com conta" : "Sem conta"}</span>
                    {c.profiles?.marketing_opt_in && <span className="badge">Aceita marketing</span>}
                  </span>
                </div>
                <div className="muted">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "Sem contactos"} · {n === 1 ? "1 pedido" : `${n} pedidos`} · desde {formatDate(c.created_at)}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Nenhum cliente encontrado.</p>
      )}
    </section>
  );
}
