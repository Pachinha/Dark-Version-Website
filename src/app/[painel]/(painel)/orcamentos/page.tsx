import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StatusFilters from "@/components/admin/StatusFilters";
import { QUOTE_STATUS, WORK_TYPE, describeAvailability, formatDate, one, quoteRef } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminQuotesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireAdmin();
  const { estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("quote_requests")
    .select("id, ref, user_id, category, work_type, status, municipality, outside_area, availability, photos, visit_at, name, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (estado && estado in QUOTE_STATUS) query = query.eq("status", estado);
  const { data: quotes } = await query;

  return (
    <section className="panel">
      <h2>Pedidos de orçamento</h2>
      <StatusFilters statuses={QUOTE_STATUS} active={estado} />
      {quotes?.length ? (
        <ul className="list">
          {quotes.map((q) => (
            <li key={q.id}>
              <Link href={panel(`/orcamentos/${q.id}`)} className="item" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div className="item-head">
                  <strong>
                    {q.category}
                    {q.work_type && ` · ${WORK_TYPE[q.work_type]}`} — {one(q.profiles)?.full_name || q.name}
                  </strong>
                  <span className="row" style={{ gap: 6 }}>
                    {q.outside_area && <span className="pref pref-fora">Fora da zona</span>}
                    {!q.user_id && <span className="pref">Sem conta</span>}
                    <span className="badge">{QUOTE_STATUS[q.status] ?? q.status}</span>
                  </span>
                </div>
                <div className="muted">
                  {quoteRef(q.ref)} · {formatDate(q.created_at, true)}
                  {q.municipality && ` · ${q.municipality}`}
                  {q.photos?.length > 0 && ` · ${q.photos.length} foto${q.photos.length > 1 ? "s" : ""}`}
                  {" · "}
                  {q.visit_at ? `Visita: ${formatDate(q.visit_at, true)}` : `Prefere: ${describeAvailability(q.availability)}`}
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
