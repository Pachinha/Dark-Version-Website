"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import FormMessage from "@/components/account/FormMessage";

// Reached from the password-reset email (via /auth/confirm, which signs the user in).
export default function NovaPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <section className="panel" style={{ maxWidth: 460 }}>
      <h2>Nova palavra-passe</h2>
      {state?.success ? (
        <FormMessage state={state} />
      ) : (
        <form action={action} className="form">
          <label className="field">
            Nova palavra-passe <span className="hint">Mínimo 8 caracteres</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} />
          </label>
          <label className="field">
            Confirmar palavra-passe
            <input name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          </label>
          <FormMessage state={state} />
          <button className="btn btn-fire" disabled={pending}>
            {pending ? "A guardar…" : "Guardar"}
          </button>
        </form>
      )}
    </section>
  );
}
