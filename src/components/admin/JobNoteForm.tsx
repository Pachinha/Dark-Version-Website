"use client";

import { useActionState, useEffect, useRef } from "react";
import { addJobNote } from "@/app/actions/sheets";
import FormMessage from "@/components/account/FormMessage";
import { JOB_NOTE_KIND } from "@/lib/labels";

export default function JobNoteForm({ jobId, isAdmin }: { jobId: string; isAdmin: boolean }) {
  const [state, action, pending] = useActionState(addJobNote, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form">
      <input type="hidden" name="job_id" value={jobId} />
      <label className="field">
        Tipo
        <select name="kind" defaultValue="material">
          {Object.entries(JOB_NOTE_KIND).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="field">
        Nota
        <textarea name="body" required maxLength={2000} style={{ minHeight: 80 }} placeholder="Ex.: Foi preciso mais 1 tubo inox D200 e uma curva de 45°." />
      </label>
      <FormMessage state={state} />
      <div className="row">
        <button className="btn btn-fire" disabled={pending}>{pending ? "A guardar…" : "Adicionar nota"}</button>
        {!isAdmin && <span className="hint">A administração é avisada no Telegram. O cliente não vê estas notas.</span>}
      </div>
    </form>
  );
}
