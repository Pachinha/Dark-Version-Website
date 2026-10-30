"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import FormMessage from "@/components/account/FormMessage";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  if (state?.success) return <FormMessage state={state} />;

  return (
    <form action={action} className="form">
      <label className="field">
        Nome
        <input name="full_name" autoComplete="name" required minLength={2} />
      </label>
      <label className="field">
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        Telefone <span className="hint">Opcional — para combinarmos visitas técnicas</span>
        <input name="phone" type="tel" autoComplete="tel" />
      </label>
      <label className="field">
        Palavra-passe <span className="hint">Mínimo 8 caracteres</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>

      {/* RGPD: caixas nunca pré-assinaladas; marketing separado e opcional */}
      <label className="check">
        <input type="checkbox" name="privacy" required />
        <span>
          Li e aceito a{" "}
          <a href="/privacidade" target="_blank">Política de Privacidade</a> e os{" "}
          <a href="/termos" target="_blank">Termos de Utilização</a>. <strong>(obrigatório)</strong>
        </span>
      </label>
      <label className="check">
        <input type="checkbox" name="marketing" />
        <span>
          Quero receber novidades e promoções por email. (opcional — pode cancelar a qualquer momento)
        </span>
      </label>

      <FormMessage state={state} />
      <button className="btn btn-fire" disabled={pending}>
        {pending ? "A criar conta…" : "Criar conta"}
      </button>
    </form>
  );
}
