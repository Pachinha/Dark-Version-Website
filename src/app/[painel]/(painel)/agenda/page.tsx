import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE_SERVICE, formatTime, lisbonDay, one } from "@/lib/labels";
import { panel } from "@/lib/panel";

type Event = { id: string; kind: string; label: string; start: string; days: string[]; href: string; done: boolean };

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_MS = 24 * 3600 * 1000;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function daysBetween(from: string, to: string) {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`) && out.length < 62; t += DAY_MS) {
    out.push(isoDay(new Date(t)));
  }
  return out;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tecnico?: string }>;
}) {
  const { profile } = await requireStaff();
  const { mes, tecnico } = await searchParams;
  const supabase = await createClient();

  const today = lisbonDay(new Date());
  const month = /^\d{4}-\d{2}$/.test(mes ?? "") ? mes! : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const gridStart = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY_MS); // Monday
  const last = new Date(Date.UTC(y, m, 0));
  const gridEnd = new Date(last.getTime() + (6 - ((last.getUTCDay() + 6) % 7)) * DAY_MS); // Sunday
  const days = daysBetween(isoDay(gridStart), isoDay(gridEnd));

  // Fetch with a day of margin for the Lisbon/UTC offset.
  const from = new Date(gridStart.getTime() - DAY_MS).toISOString();
  const to = new Date(gridEnd.getTime() + 2 * DAY_MS).toISOString();

  let maintQuery = supabase
    .from("maintenance_requests")
    .select("id, service, status, scheduled_for, name, profiles!maintenance_requests_user_id_fkey(full_name)")
    .in("status", ["agendado", "concluido"])
    .gte("scheduled_for", from)
    .lte("scheduled_for", to);
  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, status, scheduled_start, scheduled_end, name, profiles!jobs_user_id_fkey(full_name), quote:quote_requests(name)")
    .in("status", ["agendado", "em_curso", "concluido"])
    .lte("scheduled_start", to)
    .or(`scheduled_end.gte.${from},and(scheduled_end.is.null,scheduled_start.gte.${from})`);
  if (tecnico) {
    maintQuery = maintQuery.eq("technician_id", tecnico);
    jobsQuery = jobsQuery.eq("technician_id", tecnico);
  }

  // Visitas técnicas para orçamento: o administrador vê todas; o técnico só as que lhe
  // foram atribuídas (a base de dados filtra).
  let visitsQuery = supabase
    .from("quote_requests")
    .select("id, category, status, visit_at, name, profiles!quote_requests_user_id_fkey(full_name)")
    .in("status", ["visita_marcada", "visita_feita"])
    .gte("visit_at", from)
    .lte("visit_at", to);
  if (tecnico) visitsQuery = visitsQuery.eq("technician_id", tecnico);

  const [maint, jobs, staff, visits] = await Promise.all([
    maintQuery,
    jobsQuery,
    profile.role === "admin"
      ? supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name")
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    visitsQuery,
  ]);

  const name = (p: unknown) => (Array.isArray(p) ? p[0]?.full_name : (p as { full_name?: string } | null)?.full_name) ?? "";

  const events: Event[] = [
    ...(maint.data ?? []).map((e) => ({
      id: e.id,
      kind: e.service,
      label: `${formatTime(e.scheduled_for)} ${MAINTENANCE_SERVICE[e.service]} — ${name(e.profiles) || e.name}`,
      start: e.scheduled_for!,
      days: [lisbonDay(e.scheduled_for!)],
      href: panel(`/manutencao/${e.id}`),
      done: e.status === "concluido",
    })),
    ...(jobs.data ?? []).map((e) => ({
      id: e.id,
      kind: "obra",
      label: `${formatTime(e.scheduled_start)} Obra: ${e.title} — ${name(e.profiles) || e.name || (one(e.quote) as { name?: string } | null)?.name || ""}`,
      start: e.scheduled_start!,
      days: daysBetween(lisbonDay(e.scheduled_start!), lisbonDay(e.scheduled_end ?? e.scheduled_start!)),
      href: panel(`/obras/${e.id}`),
      done: e.status === "concluido",
    })),
    ...(visits.data ?? []).map((e) => ({
      id: e.id,
      kind: "visita",
      label: `${formatTime(e.visit_at)} Visita orçamento: ${e.category} — ${name(e.profiles) || e.name}`,
      start: e.visit_at!,
      days: [lisbonDay(e.visit_at!)],
      // O técnico não tem acesso à gestão de orçamentos: abre a ficha só de consulta.
      href: panel(profile.role === "admin" ? `/orcamentos/${e.id}` : `/partilhados/pedido/${e.id}`),
      done: e.status === "visita_feita",
    })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  const byDay = new Map<string, Event[]>();
  for (const e of events) for (const d of e.days) byDay.set(d, [...(byDay.get(d) ?? []), e]);

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return isoDay(d).slice(0, 7);
  };
  const qs = (mon: string) => `?mes=${mon}${tecnico ? `&tecnico=${tecnico}` : ""}`;
  const monthName = first.toLocaleDateString("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <section className="panel">
      <div className="item-head" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, textTransform: "capitalize" }}>{monthName}</h2>
        <div className="row">
          <Link className="btn btn-ghost btn-sm" href={qs(shift(-1))}>← Anterior</Link>
          <Link className="btn btn-ghost btn-sm" href={qs(today.slice(0, 7))}>Hoje</Link>
          <Link className="btn btn-ghost btn-sm" href={qs(shift(1))}>Seguinte →</Link>
        </div>
      </div>

      {profile.role === "admin" && (staff.data?.length ?? 0) > 0 && (
        <div className="filters">
          <Link className={`filter${!tecnico ? " filter-active" : ""}`} href={`?mes=${month}`}>Todos</Link>
          {staff.data!.map((s) => (
            <Link key={s.id} className={`filter${tecnico === s.id ? " filter-active" : ""}`} href={`?mes=${month}&tecnico=${s.id}`}>
              {s.full_name || "(sem nome)"}
            </Link>
          ))}
        </div>
      )}

      <div className="legend">
        <span><i className="event-limpeza" /> Limpeza</span>
        <span><i className="event-manutencao" /> Manutenção</span>
        <span><i className="event-assistencia" /> Assistência</span>
        <span><i className="event-obra" /> Obra</span>
        {profile.role === "admin" && <span><i className="event-visita" /> Visita orçamento</span>}
      </div>

      <div className="calendar">
        {WEEKDAYS.map((d) => <div key={d} className="cal-head">{d}</div>)}
        {days.map((d) => (
          <div
            key={d}
            className={`cal-day${d.slice(0, 7) !== month ? " cal-day-out" : ""}${d === today ? " cal-day-today" : ""}`}
          >
            <div className="cal-num">{Number(d.slice(8))}</div>
            {byDay.get(d)?.map((e) => (
              <Link key={e.id} href={e.href} className={`event event-${e.kind}${e.done ? " event-done" : ""}`} title={e.label}>
                {e.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: list view */}
      <div className="cal-list">
        {days.filter((d) => d.slice(0, 7) === month && byDay.has(d)).map((d) => (
          <div key={d} style={{ marginBottom: 14 }}>
            <strong style={{ fontSize: 14 }}>
              {new Date(`${d}T12:00:00Z`).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
            </strong>
            {byDay.get(d)!.map((e) => (
              <Link key={e.id} href={e.href} className={`event event-${e.kind}${e.done ? " event-done" : ""}`} style={{ whiteSpace: "normal", fontSize: 13.5, padding: "6px 10px" }}>
                {e.label}
              </Link>
            ))}
          </div>
        ))}
        {events.length === 0 && <p className="muted">Nada agendado neste mês.</p>}
      </div>
    </section>
  );
}
