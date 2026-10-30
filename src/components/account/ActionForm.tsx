"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import FormMessage from "./FormMessage";

// Small wrapper so server-rendered fields can be submitted to a server action
// with pending state and an inline result message.
export default function ActionForm({
  action,
  children,
  submitLabel = "Guardar",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="form" style={{ gap: 10, marginTop: 10 }}>
      {children}
      <div className="row">
        <button className="btn btn-ink btn-sm" disabled={pending}>
          {pending ? "A guardar…" : submitLabel}
        </button>
        {(state?.error || state?.success) && <FormMessage state={state} />}
      </div>
    </form>
  );
}
