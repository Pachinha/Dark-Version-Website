import { JOB_STATUS, toLocalInput } from "@/lib/labels";

export const JOB_LABELS = {
  title: "Título",
  status: "Estado",
  scheduled_start: "Início",
  scheduled_end: "Fim previsto",
  address_id: "Morada",
  technician_id: "Técnico",
  description: "Descrição",
  client_notes: "Nota para o cliente",
  internal_notes: "Notas internas",
};

type Job = {
  title?: string;
  description?: string;
  status?: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  address_id?: string | null;
  technician_id?: string | null;
  client_notes?: string | null;
  internal_notes?: string | null;
};

// Fields shared by "Nova obra" and the job edit page. Technicians only get status and notes.
export default function JobFields({
  job = {},
  addresses,
  staff,
  isAdmin,
}: {
  job?: Job;
  addresses: { id: string; label: string; address: string }[];
  staff: { id: string; full_name: string }[];
  isAdmin: boolean;
}) {
  const locked = !isAdmin;
  return (
    <>
      <label className="field">
        Título
        <input name="title" defaultValue={job.title} required minLength={2} maxLength={200} readOnly={locked}
          placeholder="Ex.: Instalação recuperador Solzaima + conduta" />
      </label>
      <label className="field">
        Estado
        <select name="status" defaultValue={job.status ?? "por_agendar"}>
          {Object.entries(JOB_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          Início
          <input type="datetime-local" name="scheduled_start" defaultValue={toLocalInput(job.scheduled_start)} readOnly={locked} />
        </label>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          Fim previsto
          <input type="datetime-local" name="scheduled_end" defaultValue={toLocalInput(job.scheduled_end)} readOnly={locked} />
        </label>
      </div>
      {isAdmin && (
        <>
          <label className="field">
            Morada
            <select name="address_id" defaultValue={job.address_id ?? addresses[0]?.id ?? ""}>
              <option value="">— Sem morada —</option>
              {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address}</option>)}
            </select>
          </label>
          <label className="field">
            Técnico
            <select name="technician_id" defaultValue={job.technician_id ?? ""}>
              <option value="">— Sem técnico —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || "(sem nome)"}</option>)}
            </select>
          </label>
        </>
      )}
      {!isAdmin && (
        <>
          <input type="hidden" name="address_id" value={job.address_id ?? ""} />
          <input type="hidden" name="technician_id" value={job.technician_id ?? ""} />
        </>
      )}
      <label className="field">
        Descrição
        <textarea name="description" defaultValue={job.description} readOnly={locked} style={{ minHeight: 80 }} />
      </label>
      <label className="field">
        Nota para o cliente <span className="hint">O cliente vê esta nota na área de cliente</span>
        <input name="client_notes" defaultValue={job.client_notes ?? ""} />
      </label>
      <label className="field">
        Notas internas <span className="hint">Só a equipa vê</span>
        <textarea name="internal_notes" defaultValue={job.internal_notes ?? ""} style={{ minHeight: 70 }} />
      </label>
    </>
  );
}
