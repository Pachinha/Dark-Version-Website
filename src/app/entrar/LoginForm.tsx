"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import FormMessage from "@/components/account/FormMessage";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        Palavra-passe
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <label className="check">
        <input type="checkbox" name="remember" defaultChecked />
        <span>Manter sessão iniciada neste dispositivo <span className="hint">(desmarque num computador partilhado)</span></span>
      </label>
      <FormMessage state={state} />
      <button className="btn btn-fire" disabled={pending}>
        {pending ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
