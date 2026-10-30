import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE_SERVICE, formatDate, formatTime, lisbonDay, one } from "@/lib/labels";
import { googleMapsSearchUrl, googleMapsUrl, wazeSearchUrl, wazeUrl } from "@/lib/geo";
import { panel } from "@/lib/panel";

type Item = {
  id: string;
  kind: "obra" | string;
  title: string;
  when: string;
  client: string;
  phone: string;
  address: { address: string; details: string; lat?: number; lng?: number } | null;
  href: string;
};

export default async function AdminHome() {
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const dayStart = new Date(`${lisbonDay(now)}T00:00:00Z`);
  dayStart.setUTCHours(dayStart.getUTCHours() - 2); // margin for the Lisbon offset

  const count = (table: string, column: string, value: string) =>
    supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value);

  const [newQuotes, pendingMaint, unscheduledJobs, maint, jobs, visits] = await Promise.all([
    isAdmin ? count("quote_requests", "status", "novo") : Promise.resolve({ count: 0 }),
    count("maintenance_requests", "status", "pendente"),
    count("jobs", "status", "por_agendar"),
    supabase
      .from("maintenance_requests")
      .select("id, service, scheduled_for, profiles!maintenance_requests_user_id_fkey(full_name, phone), addresses(address, details, lat, lng)")
      .eq("status", "agendado")
      .gte("scheduled_for", dayStart.toISOString())
      .lte("scheduled_for", weekEnd.toISOString())
      .order("scheduled_for"),
    supabase
      .from("jobs")
      .select("id, title, scheduled_start, profiles!jobs_user_id_fkey(full_name, phone), addresses(address, details, lat, lng)")
      .in("status", ["agendado", "em_curso"])
      .gte("scheduled_start", dayStart.toISOString())
      .lte("scheduled_start", weekEnd.toISOString())
      .order("scheduled_start"),
    isAdmin
      ? supabase
          .from("quote_requests")
          .select("id, category, visit_at, name, phone, address, municipality, profiles(full_name, phone)")
          .eq("status", "visita_marcada")
          .gte("visit_at", dayStart.toISOString())
          .lte("visit_at", weekEnd.toISOString())
          .order("visit_at")
      : Promise.resolve({ data: [] }),
  ]);

  const items: Item[] = [
    ...(maint.data ?? []).map((m) => ({
      id: m.id,
      kind: m.service,
      title: MAINTENANCE_SERVICE[m.service],
      when: m.scheduled_for!,
      client: one(m.profiles)?.full_name ?? "",
      phone: one(m.profiles)?.phone ?? "",
      address: one(m.addresses),
      href: panel(`/manutencao/${m.id}`),
    })),
    ...(jobs.data ?? []).map((j) => ({
      id: j.id,
      kind: "obra",
      title: `Obra: ${j.title}`,
      when: j.scheduled_start!,
      client: one(j.profiles)?.full_name ?? "",
      phone: one(j.profiles)?.phone ?? "",
      address: one(j.addresses),
      href: panel(`/obras/${j.id}`),
    })),
    ...(visits.data ?? []).map((v) => ({
      id: v.id,
      kind: "visita",
      title: `Visita para orçamento: ${v.category}`,
      when: v.visit_at!,
      client: one(v.profiles)?.full_name || v.name,
      phone: v.phone || one(v.profiles)?.phone || "",
      address: { address: [v.address, v.municipality].filter(Boolean).join(", "), details: "" },
      href: panel(`/orcamentos/${v.id}`),
    })),
  ].sort((a, b) => a.when.localeCompare(b.when));

  const today = lisbonDay(now);
  const todayItems = items.filter((i) => lisbonDay(i.when) === today);
  const weekItems = items.filter((i) => lisbonDay(i.when) !== today);

  return (
    <>
      <div className="stats">
        <Stat value={todayItems.length} label="Serviços hoje" href={panel("/agenda")} />
        <Stat value={weekItems.length} label="Próximos 7 dias" href={panel("/agenda")} />
        {isAdmin && <Stat value={newQuotes.count ?? 0} label="Orçamentos em espera" href={panel("/orcamentos")} alert />}
        <Stat value={pendingMaint.count ?? 0} label="Limpezas por agendar" href={panel("/manutencao?estado=pendente")} alert />
        <Stat value={unscheduledJobs.count ?? 0} label="Obras por agendar" href={panel("/obras?estado=por_agendar")} alert />
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Hoje</h2>
          <Agenda items={todayItems} empty="Nada agendado para hoje." />
        </section>
        <section className="panel">
          <h2>Próximos 7 dias</h2>
          <Agenda items={weekItems} empty="Nada agendado para os próximos dias." showDate />
        </section>
      </div>
    </>
  );
}

function Stat({ value, label, href, alert }: { value: number; label: string; href: string; alert?: boolean }) {
  return (
    <Link href={href} className={`stat${alert && value > 0 ? " stat-alert" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </Link>
  );
}

function Agenda({ items, empty, showDate }: { items: Item[]; empty: string; showDate?: boolean }) {
  if (!items.length) return <p className="muted" style={{ marginBottom: 0 }}>{empty}</p>;
  return (
    <ul className="list">
      {items.map((i) => (
        <li key={i.id} className="item">
          <div className="item-head">
            <Link href={i.href} className="link"><strong>{i.title}</strong></Link>
            <span className={`event event-${i.kind}`} style={{ marginTop: 0 }}>
              {showDate && `${formatDate(i.when)} · `}{formatTime(i.when)}
            </span>
          </div>
          <div>{i.client}{i.phone && <> · <a className="link" href={`tel:${i.phone}`}>{i.phone}</a></>}</div>
          {i.address && (
            <>
              <div className="muted">{i.address.address}{i.address.details && ` — ${i.address.details}`}</div>
              <div className="row" style={{ marginTop: 6 }}>
                <a className="link" href={i.address.lat != null && i.address.lng != null ? googleMapsUrl(i.address.lat, i.address.lng) : googleMapsSearchUrl(i.address.address)} target="_blank" rel="noreferrer">Google Maps ↗</a>
                <a className="link" href={i.address.lat != null && i.address.lng != null ? wazeUrl(i.address.lat, i.address.lng) : wazeSearchUrl(i.address.address)} target="_blank" rel="noreferrer">Waze ↗</a>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
