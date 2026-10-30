import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, marketing_opt_in, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data: clients } = await query;

  return (
    <section className="panel">
      <h2>Clientes</h2>
      <form className="row" style={{ marginBottom: 16 }}>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          <span className="hint">Pesquisar por nome, email ou telefone</span>
          <input name="q" defaultValue={q} />
        </label>
        <button className="btn btn-ink btn-sm" style={{ alignSelf: "flex-end", marginBottom: 4 }}>Pesquisar</button>
      </form>
      {clients?.length ? (
        <ul className="list">
          {clients.map((c) => (
            <li key={c.id} className="item">
              <div className="item-head">
                <Link className="link" href={panel(`/clientes/${c.id}`)}><strong>{c.full_name || "(sem nome)"}</strong></Link>
                <span className="row" style={{ gap: 6 }}>
                  {c.role === "admin" && <span className="badge">Admin</span>}
                  {c.marketing_opt_in && <span className="badge">Aceita marketing</span>}
                </span>
              </div>
              <div className="muted">
                {c.email}{c.phone && ` · ${c.phone}`} · cliente desde {formatDate(c.created_at)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Nenhum cliente encontrado.</p>
      )}
    </section>
  );
}
