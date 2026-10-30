"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";
import FormMessage from "@/components/account/FormMessage";
import type { Profile } from "@/lib/auth";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="form">
      <label className="field">
        Nome
        <input name="full_name" defaultValue={profile.full_name} autoComplete="name" required minLength={2} />
      </label>
      <label className="field">
        Telefone
        <input name="phone" type="tel" defaultValue={profile.phone} autoComplete="tel" />
      </label>
      <label className="check">
        <input type="checkbox" name="marketing" defaultChecked={profile.marketing_opt_in} />
        <span>Quero receber novidades e promoções por email.</span>
      </label>
      <FormMessage state={state} />
      <button className="btn btn-fire" disabled={pending}>
        {pending ? "A guardar…" : "Guardar"}
      </button>
    </form>
  );
}
