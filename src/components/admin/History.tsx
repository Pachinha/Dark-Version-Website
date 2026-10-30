import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/labels";

const FIELD_LABEL: Record<string, string> = {
  status: "Estado",
  scheduled_for: "Data da visita",
  scheduled_start: "Início",
  scheduled_end: "Fim",
  technician_id: "Técnico",
  duration_minutes: "Duração",
  admin_notes: "Nota para o cliente",
  admin_reply: "Resposta",
  title: "Título",
  description: "Descrição",
  address_id: "Morada",
  client_notes: "Nota para o cliente",
  internal_notes: "Notas internas",
};

// Audit trail (written automatically by a database trigger) + notifications sent.
export default async function History({ entityId }: { entityId: string }) {
  const supabase = await createClient();
  const [changes, notifications] = await Promise.all([
    supabase
      .from("change_log")
      .select("id, old_data, new_data, created_at, profiles(full_name)")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notifications")
      .select("id, channel, created_at, profiles!notifications_sent_by_fkey(full_name)")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false }),
  ]);

  type Row = { id: number; created_at: string; text: string };
  const who = (p: unknown) => (Array.isArray(p) ? p[0]?.full_name : (p as { full_name?: string } | null)?.full_name) || "Sistema";

  const rows: Row[] = [
    ...(changes.data ?? []).map((c) => {
      const fields = Object.keys(c.new_data).filter(
        (k) => k in FIELD_LABEL && JSON.stringify(c.old_data[k]) !== JSON.stringify(c.new_data[k]),
      );
      return {
        id: c.id,
        created_at: c.created_at,
        text: `${who(c.profiles)} alterou: ${fields.map((f) => FIELD_LABEL[f]).join(", ") || "detalhes"}`,
      };
    }),
    ...(notifications.data ?? []).map((n) => ({
      id: -n.id,
      created_at: n.created_at,
      text: `${who(n.profiles)} notificou o cliente por ${n.channel === "email" ? "email" : "WhatsApp"}`,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <section className="panel">
      <h2>Histórico</h2>
      {rows.length ? (
        <ul className="list" style={{ gap: 6 }}>
          {rows.map((r) => (
            <li key={r.id} className="muted">
              {formatDate(r.created_at, true)} — {r.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Sem alterações registadas.</p>
      )}
    </section>
  );
}
