"use client";

import { useActionState, useState, useTransition } from "react";
import { confirmEnroll, disableMfa, startEnroll, verifyCode, type EnrollStart } from "@/app/actions/mfa";
import FormMessage from "./FormMessage";

function CodeInput() {
  return (
    <label className="field">
      Código de 6 dígitos
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        autoFocus
        style={{ fontSize: 22, letterSpacing: "0.3em", textAlign: "center" }}
      />
    </label>
  );
}

export function MfaVerifyForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyCode, undefined);
  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <CodeInput />
      <FormMessage state={state} />
      <button className="btn btn-fire" disabled={pending}>{pending ? "A verificar…" : "Confirmar"}</button>
    </form>
  );
}

export function MfaEnroll({ next, startLabel = "Ativar verificação em dois passos" }: { next?: string; startLabel?: string }) {
  const [enroll, setEnroll] = useState<EnrollStart | null>(null);
  const [starting, startTransition] = useTransition();
  const [state, action, pending] = useActionState(confirmEnroll, undefined);

  if (state?.success) return <FormMessage state={state} />;

  if (!enroll || "error" in enroll) {
    return (
      <div className="form">
        {enroll && "error" in enroll && <p className="alert alert-error">{enroll.error}</p>}
        <button
          type="button"
          className="btn btn-ink"
          disabled={starting}
          onClick={() => startTransition(async () => setEnroll(await startEnroll()))}
        >
          {starting ? "A preparar…" : startLabel}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="form">
      <ol className="muted" style={{ margin: 0, paddingLeft: 18 }}>
        <li>Instale no telemóvel a app <strong>Google Authenticator</strong> (ou Microsoft Authenticator).</li>
        <li>Na app, toque em <strong>+</strong> → <strong>Ler código QR</strong> e aponte para este código:</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from Supabase */}
      <img src={enroll.qr} alt="Código QR para a app de autenticação" width={200} height={200}
        style={{ background: "#fff", borderRadius: 12, padding: 8, alignSelf: "center" }} />
      <details className="hint">
        <summary>Não consegue ler o código? Introduza esta chave manualmente</summary>
        <code style={{ wordBreak: "break-all", fontSize: 13 }}>{enroll.secret}</code>
      </details>
      <p className="muted" style={{ margin: 0 }}>3. Escreva o código de 6 dígitos que aparece na app:</p>
      <input type="hidden" name="factorId" value={enroll.factorId} />
      {next && <input type="hidden" name="next" value={next} />}
      <CodeInput />
      <FormMessage state={state} />
      <button className="btn btn-fire" disabled={pending}>{pending ? "A confirmar…" : "Confirmar e ativar"}</button>
    </form>
  );
}

export function MfaDisable() {
  const [state, action, pending] = useActionState(disableMfa, undefined);
  return (
    <form action={action} className="form">
      <FormMessage state={state} />
      {!state?.success && (
        <button className="btn btn-ghost btn-sm" disabled={pending}>{pending ? "A desativar…" : "Desativar"}</button>
      )}
    </form>
  );
}
