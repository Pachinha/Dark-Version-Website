import { deleteJobNote, notifyJobNote } from "@/app/actions/sheets";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import JobNoteForm from "@/components/admin/JobNoteForm";
import { JOB_NOTE_KIND, formatDate, one } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

type Note = {
  id: number;
  kind: string;
  body: string;
  created_at: string;
  client_notified_at: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

// Notas da obra: a equipa regista material e alterações; só a administração avisa o cliente.
export default async function JobNotes({ jobId, isAdmin }: { jobId: string; isAdmin: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_notes")
    .select("id, kind, body, created_at, client_notified_at, profiles!job_notes_author_id_fkey(full_name)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  const notes = (data ?? []) as Note[];

  return (
    <section className="panel">
      <h2>Notas da obra</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Material adicionado, alterações ao trabalho, imprevistos. Só a equipa vê estas notas
        {isAdmin ? " — use “Avisar cliente” quando quiser informar o cliente de uma alteração." : "."}
      </p>
      <JobNoteForm jobId={jobId} isAdmin={isAdmin} />

      {notes.length > 0 && (
        <ul className="list" style={{ marginTop: 20 }}>
          {notes.map((n) => (
            <li key={n.id} className="item">
              <div className="item-head">
                <strong>{JOB_NOTE_KIND[n.kind] ?? n.kind}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {one(n.profiles)?.full_name || "—"} · {formatDate(n.created_at, true)}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{n.body}</p>
              {isAdmin && (
                <div className="row" style={{ marginTop: 10 }}>
                  {n.client_notified_at ? (
                    <span className="badge">✓ Cliente avisado a {formatDate(n.client_notified_at)}</span>
                  ) : (
                    <ConfirmedForm action={notifyJobNote} labels={{}} mode="create" submitLabel="Avisar cliente" confirmTitle="Avisar o cliente desta alteração na obra?">
                      <input type="hidden" name="note_id" value={n.id} />
                    </ConfirmedForm>
                  )}
                  <form action={deleteJobNote} style={{ marginLeft: "auto" }}>
                    <input type="hidden" name="note_id" value={n.id} />
                    <input type="hidden" name="job_id" value={jobId} />
                    <button className="btn btn-ghost btn-sm">Apagar</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
