"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { EditResult } from "@/app/actions/admin";
import { logNotification } from "@/app/actions/admin";
import { mailtoUrl, whatsappNumber, whatsappUrl, type Notice } from "@/lib/notify";

type Change = { label: string; from: string; to: string };

// Readable value of each labelled field, e.g. the option text of a <select>.
function snapshot(form: HTMLFormElement, labels: Record<string, string>) {
  const values = new Map<string, string>();
  for (const name of Object.keys(labels)) {
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLSelectElement) values.set(name, el.selectedOptions[0]?.text ?? "");
    else if (el instanceof HTMLInputElement && el.type === "datetime-local" && el.value)
      values.set(name, new Date(el.value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }));
    else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) values.set(name, el.value.trim());
  }
  return values;
}

/**
 * Admin edit flow:
 *   Guardar → "Deseja mesmo alterar isto?" (with the list of changes) → Sim
 *   → saved → "Deseja notificar o cliente?" → Email | WhatsApp | Não notificar
 */
export default function ConfirmedForm({
  action,
  labels,
  children,
  submitLabel = "Guardar alterações",
  confirmTitle = "Deseja mesmo alterar isto?",
  mode = "edit",
  danger = false,
}: {
  action: (formData: FormData) => Promise<EditResult>;
  labels: Record<string, string>;
  children: React.ReactNode;
  submitLabel?: string;
  confirmTitle?: string;
  mode?: "edit" | "create";
  danger?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const notifyRef = useRef<HTMLDialogElement>(null);
  const initial = useRef<Map<string, string>>(new Map());
  const redirect = useRef<string | undefined>(undefined);

  const [changes, setChanges] = useState<Change[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (formRef.current) initial.current = snapshot(formRef.current, labels);
  }, [labels]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const now = snapshot(form, labels);
    const diff: Change[] = [];
    now.forEach((to, name) => {
      const from = initial.current.get(name) ?? "";
      if (mode === "create" ? to : from !== to) diff.push({ label: labels[name], from, to });
    });
    if (mode === "edit" && diff.length === 0) {
      setError("Não alterou nada.");
      return;
    }
    setChanges(diff);
    confirmRef.current?.showModal();
  }

  function confirm() {
    confirmRef.current?.close();
    const form = formRef.current;
    if (!form) return;
    startTransition(async () => {
      const result = await action(new FormData(form));
      if (result?.error) {
        setError(result.error);
        return;
      }
      initial.current = snapshot(form, labels);
      redirect.current = result?.redirectTo;
      if (result?.notice) {
        setNotice(result.notice);
        notifyRef.current?.showModal();
      } else {
        finish();
      }
    });
  }

  function finish() {
    notifyRef.current?.close();
    setNotice(null);
    if (redirect.current) router.push(redirect.current);
    else router.refresh();
  }

  function send(channel: "email" | "whatsapp") {
    if (!notice) return;
    if (channel === "email") window.location.href = mailtoUrl(notice.email, notice.subject, notice.message);
    else window.open(whatsappUrl(notice.phone, notice.message), "_blank", "noopener");
    void logNotification(notice, channel);
    finish();
  }

  const canWhatsapp = notice ? whatsappNumber(notice.phone) !== "" : false;

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="form">
        {children}
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <div className="row">
          <button className={`btn ${danger ? "btn-danger" : "btn-fire"}`} disabled={pending}>
            {pending ? "A guardar…" : submitLabel}
          </button>
        </div>
      </form>

      <dialog ref={confirmRef} className="modal" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{confirmTitle}</h2>
        {changes.length > 0 && (
          <ul className="change-list">
            {changes.map((c) => (
              <li key={c.label}>
                <strong>{c.label}:</strong>{" "}
                {mode === "edit" && <><s>{c.from || "—"}</s> → </>}
                {c.to || "—"}
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => confirmRef.current?.close()}>
            Não, voltar
          </button>
          <button type="button" className={`btn ${danger ? "btn-danger" : "btn-fire"}`} onClick={confirm} autoFocus>
            Sim, confirmar
          </button>
        </div>
      </dialog>

      <dialog
        ref={notifyRef}
        className="modal"
        aria-labelledby="notify-title"
        onCancel={(e) => {
          e.preventDefault();
          finish();
        }}
      >
        <h2 id="notify-title">✓ Guardado. Deseja notificar o cliente?</h2>
        {notice && (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              {notice.name} · {notice.email}
              {notice.phone && ` · ${notice.phone}`}
            </p>
            <pre className="message-preview">{notice.message}</pre>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={finish}>
                Não notificar
              </button>
              <button type="button" className="btn btn-ink" onClick={() => send("email")} disabled={!notice.email}>
                ✉️ Email
              </button>
              <button
                type="button"
                className="btn btn-whatsapp"
                onClick={() => send("whatsapp")}
                disabled={!canWhatsapp}
                title={canWhatsapp ? undefined : "O cliente não tem telefone registado"}
              >
                WhatsApp
              </button>
            </div>
            {!canWhatsapp && (
              <p className="hint" style={{ marginBottom: 0 }}>WhatsApp indisponível: o cliente não tem telefone registado.</p>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
