"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import Shell from "@/components/account/Shell";
import FormMessage from "@/components/account/FormMessage";

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <Shell>
      <div className="panel auth-card">
        <span className="eyebrow">Área de cliente</span>
        <h1>Recuperar acesso</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
          Indique o email da sua conta e enviamos um link para definir uma nova palavra-passe.
        </p>
        <form action={action} className="form">
          <label className="field">
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <FormMessage state={state} />
          <button className="btn btn-fire" disabled={pending}>
            {pending ? "A enviar…" : "Enviar link"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 20, marginBottom: 0 }}>
          <Link className="link" href="/entrar">← Voltar a entrar</Link>
        </p>
      </div>
    </Shell>
  );
}
