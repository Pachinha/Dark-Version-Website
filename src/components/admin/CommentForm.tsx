"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions/sharing";
import FormMessage from "@/components/account/FormMessage";

export default function CommentForm({ clientId, quoteId }: { clientId?: string; quoteId?: string }) {
  const [state, action, pending] = useActionState(addComment, undefined);
  const form = useRef<HTMLFormElement>(null);

  // Limpar a caixa depois de gravar.
  useEffect(() => {
    if (state?.success) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="form" style={{ gap: 10, marginTop: 12 }}>
      {clientId && <input type="hidden" name="client_id" value={clientId} />}
      {quoteId && <input type="hidden" name="quote_id" value={quoteId} />}
      <label className="field">
        Novo comentário
        <textarea name="body" maxLength={2000} required style={{ minHeight: 80 }} placeholder="Ex.: Chaminé com tiragem fraca, levar tubo de 150." />
      </label>
      <div className="row">
        <button className="btn btn-ink btn-sm" disabled={pending}>
          {pending ? "A guardar…" : "Comentar"}
        </button>
        {(state?.error || state?.success) && <FormMessage state={state} />}
      </div>
    </form>
  );
}
