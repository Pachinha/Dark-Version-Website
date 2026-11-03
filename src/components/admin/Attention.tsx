import Link from "next/link";
import { MAINTENANCE_SERVICE, formatDate, one } from "@/lib/labels";
import { panel } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";

// "Precisa de atenção": tudo o que está parado há demasiado tempo, para nenhum cliente
// ficar esquecido. Prazos em dias — ajustar aqui se a Sandra preferir outros.
export const STALE_DAYS = {
  quoteNoReply: 2, // pedido de orçamento novo, ainda sem resposta
  visitPassed: 1, // a visita marcada já passou e o pedido não avançou
  visitNoQuote: 3, // visita feita, orçamento ainda por enviar
  draftSheet: 2, // folha de orçamento em rascunho, por enviar
  quoteNoAnswer: 7, // orçamento enviado, cliente ainda não confirmou → fazer seguimento
  maintenanceUnscheduled: 3, // pedido de limpeza/manutenção por agendar
  maintenancePassed: 1, // limpeza agendada que já passou e não foi dada como concluída
  jobUnscheduled: 7, // obra por agendar
  jobOverdue: 1, // obra que passou a data prevista de fim
};

type Alert = { key: string; days: number; limit: number; title: string; detail: string; href: string };

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY));
const plural = (n: number) => `${n} dia${n === 1 ? "" : "s"}`;
const name = (profiles: unknown, fallback = "") => (one(profiles) as { full_name?: string } | null)?.full_name || fallback;

export default async function Attention({ isAdmin }: { isAdmin: boolean }) {
  const supabase = await createClient();
  const S = STALE_DAYS;

  // O técnico só recebe (pela base de dados) as limpezas e obras que lhe estão atribuídas.
  const [quotesNew, visitsPassed, visitsDone, quotesSent, drafts, maintPending, maintPassed, jobsUnscheduled, jobsOverdue] = await Promise.all([
    isAdmin
      ? supabase.from("quote_requests").select("id, category, name, created_at, profiles!quote_requests_user_id_fkey(full_name)").eq("status", "novo").lt("created_at", ago(S.quoteNoReply))
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("quote_requests").select("id, category, name, visit_at, profiles!quote_requests_user_id_fkey(full_name)").eq("status", "visita_marcada").lt("visit_at", ago(S.visitPassed))
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("quote_requests").select("id, category, name, updated_at, profiles!quote_requests_user_id_fkey(full_name)").eq("status", "visita_feita").lt("updated_at", ago(S.visitNoQuote))
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("quote_requests").select("id, category, name, updated_at, profiles!quote_requests_user_id_fkey(full_name)").eq("status", "orcamento_enviado").lt("updated_at", ago(S.quoteNoAnswer))
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("quote_sheets").select("id, number, quote_id, updated_at, client_name").is("sent_at", null).lt("updated_at", ago(S.draftSheet))
      : Promise.resolve({ data: [] }),
    supabase.from("maintenance_requests").select("id, service, created_at, name, profiles!maintenance_requests_user_id_fkey(full_name)").eq("status", "pendente").lt("created_at", ago(S.maintenanceUnscheduled)),
    supabase.from("maintenance_requests").select("id, service, scheduled_for, name, profiles!maintenance_requests_user_id_fkey(full_name)").eq("status", "agendado").lt("scheduled_for", ago(S.maintenancePassed)),
    supabase.from("jobs").select("id, title, created_at, name, profiles!jobs_user_id_fkey(full_name), quote:quote_requests(name)").eq("status", "por_agendar").lt("created_at", ago(S.jobUnscheduled)),
    supabase.from("jobs").select("id, title, scheduled_start, scheduled_end, name, profiles!jobs_user_id_fkey(full_name), quote:quote_requests(name)").in("status", ["agendado", "em_curso"]).lt("scheduled_end", ago(S.jobOverdue)),
  ]);

  type Row = Record<string, unknown> & { id: string };
  const rows = (r: { data: unknown }) => (r.data ?? []) as Row[];
  const alerts: Alert[] = [
    ...rows(quotesNew).map((q) => ({
      key: `qn${q.id}`, days: daysSince(q.created_at as string), limit: S.quoteNoReply,
      title: "Pedido de orçamento sem resposta",
      detail: `${name(q.profiles, q.name as string)} · ${q.category} — recebido a ${formatDate(q.created_at as string)}`,
      href: panel(`/orcamentos/${q.id}`),
    })),
    ...rows(visitsPassed).map((q) => ({
      key: `vp${q.id}`, days: daysSince(q.visit_at as string), limit: S.visitPassed,
      title: "A visita já passou — atualize o pedido",
      detail: `${name(q.profiles, q.name as string)} · ${q.category} — visita a ${formatDate(q.visit_at as string)}`,
      href: panel(`/orcamentos/${q.id}`),
    })),
    ...rows(visitsDone).map((q) => ({
      key: `vd${q.id}`, days: daysSince(q.updated_at as string), limit: S.visitNoQuote,
      title: "Visita feita, orçamento por enviar",
      detail: `${name(q.profiles, q.name as string)} · ${q.category}`,
      href: panel(`/orcamentos/${q.id}`),
    })),
    ...rows(drafts).map((d) => ({
      key: `ds${d.id}`, days: daysSince(d.updated_at as string), limit: S.draftSheet,
      title: "Folha de orçamento em rascunho, por enviar",
      detail: `N.º ${String(d.number).padStart(4, "0")}${d.client_name ? ` · ${d.client_name}` : ""}`,
      href: panel(`/orcamentos/${d.quote_id}/folha/${d.id}`),
    })),
    ...rows(quotesSent).map((q) => ({
      key: `qs${q.id}`, days: daysSince(q.updated_at as string), limit: S.quoteNoAnswer,
      title: "Orçamento sem resposta do cliente — fazer seguimento",
      detail: `${name(q.profiles, q.name as string)} · ${q.category}`,
      href: panel(`/orcamentos/${q.id}`),
    })),
    ...rows(maintPending).map((m) => ({
      key: `mp${m.id}`, days: daysSince(m.created_at as string), limit: S.maintenanceUnscheduled,
      title: "Pedido de limpeza/manutenção por agendar",
      detail: `${name(m.profiles, m.name as string)} · ${MAINTENANCE_SERVICE[m.service as string] ?? m.service}`,
      href: panel(`/manutencao/${m.id}`),
    })),
    ...rows(maintPassed).map((m) => ({
      key: `ma${m.id}`, days: daysSince(m.scheduled_for as string), limit: S.maintenancePassed,
      title: "Limpeza já passou da data — está concluída?",
      detail: `${name(m.profiles, m.name as string)} · ${MAINTENANCE_SERVICE[m.service as string] ?? m.service} — agendada para ${formatDate(m.scheduled_for as string)}`,
      href: panel(`/manutencao/${m.id}`),
    })),
    ...rows(jobsUnscheduled).map((j) => ({
      key: `ju${j.id}`, days: daysSince(j.created_at as string), limit: S.jobUnscheduled,
      title: "Obra por agendar",
      detail: `${j.title} — ${name(j.profiles, (j.name as string) || name(j.quote))}`,
      href: panel(`/obras/${j.id}`),
    })),
    ...rows(jobsOverdue).map((j) => ({
      key: `jo${j.id}`, days: daysSince(j.scheduled_end as string), limit: S.jobOverdue,
      title: "Obra passou a data prevista de fim",
      detail: `${j.title} — ${name(j.profiles, (j.name as string) || name(j.quote))} · fim previsto a ${formatDate(j.scheduled_end as string)}`,
      href: panel(`/obras/${j.id}`),
    })),
  ].sort((a, b) => b.days / b.limit - a.days / a.limit);

  if (!alerts.length) {
    return (
      <section className="panel attention attention-ok">
        <h2>✓ Nada pendente</h2>
        <p className="muted" style={{ margin: 0 }}>Não há pedidos, limpezas ou obras parados há demasiado tempo.</p>
      </section>
    );
  }

  return (
    <section className="panel attention">
      <h2>⚠ Precisa de atenção ({alerts.length})</h2>
      <p className="muted" style={{ marginTop: 0 }}>Parados há demasiado tempo — trate-os para nenhum cliente ficar à espera.</p>
      <ul className="list">
        {alerts.map((a) => (
          <li key={a.key} className={`item attention-item${a.days >= a.limit * 2 ? " attention-late" : ""}`}>
            <div className="item-head">
              <Link href={a.href} className="link"><strong>{a.title}</strong></Link>
              <span className="badge">há {plural(a.days)}</span>
            </div>
            <div className="muted">{a.detail}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
