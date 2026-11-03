import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StatusFilters from "@/components/admin/StatusFilters";
import { JOB_STATUS, formatDate, one } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminJobsList({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { profile } = await requireStaff();
  const { estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("id, title, status, scheduled_start, scheduled_end, name, client:profiles!jobs_user_id_fkey(full_name), quote:quote_requests(name), tech:profiles!jobs_technician_id_fkey(full_name), addresses(locality)")
    .order("scheduled_start", { ascending: true, nullsFirst: true })
    .limit(300);
  if (estado && estado in JOB_STATUS) query = query.eq("status", estado);
  const { data: jobs } = await query;

  return (
    <section className="panel">
      <div className="item-head" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Obras & instalações</h2>
        {profile.role === "admin" && <Link href={panel("/obras/nova")} className="btn btn-fire btn-sm">+ Nova obra</Link>}
      </div>
      <StatusFilters statuses={JOB_STATUS} active={estado} />
      {jobs?.length ? (
        <ul className="list">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={panel(`/obras/${j.id}`)} className="item" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div className="item-head">
                  <strong>{j.title} — {one(j.client)?.full_name || j.name || one(j.quote)?.name}</strong>
                  <span className="badge">{JOB_STATUS[j.status]}</span>
                </div>
                <div className="muted">
                  {j.scheduled_start
                    ? `${formatDate(j.scheduled_start, true)}${j.scheduled_end ? ` → ${formatDate(j.scheduled_end)}` : ""}`
                    : "Sem data"}
                  {one(j.addresses)?.locality && ` · ${one(j.addresses)!.locality}`}
                  {one(j.tech)?.full_name && ` · Técnico: ${one(j.tech)!.full_name}`}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Sem obras.</p>
      )}
    </section>
  );
}
