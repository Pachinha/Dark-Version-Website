"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/actions/account";
import FormMessage from "@/components/account/FormMessage";

export default function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);

  return (
    <form action={action} className="form" style={{ maxWidth: 360 }}>
      <label className="field">
        Escreva APAGAR para confirmar
        <input name="confirm" autoComplete="off" required />
      </label>
      <FormMessage state={state} />
      <button className="btn btn-danger" disabled={pending}>
        {pending ? "A apagar…" : "Apagar a minha conta"}
      </button>
    </form>
  );
}
