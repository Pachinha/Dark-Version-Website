"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import FormMessage from "@/components/account/FormMessage";
import { LOCALE_NAMES } from "@/lib/i18n/config";
import { shrinkImage } from "@/lib/shrink-image";

export type Translations = Partial<Record<string, Record<string, string>>>;
type Action = (state: FormState, fd: FormData) => Promise<FormState>;

// Campos de tradução (opcionais). Vazio → o site mostra o texto em português.
export function TranslationFields({
  fields,
  values = {},
}: {
  fields: { key: string; label: string; long?: boolean }[];
  values?: Translations;
}) {
  const filled = Object.values(values).filter((v) => v && Object.values(v).some(Boolean)).length;
  return (
    <details className="tr-box">
      <summary>
        Traduções <span className="hint">(opcional — {filled ? `${filled} de 4 línguas preenchidas` : "se ficar vazio, o site mostra o português"})</span>
      </summary>
      {(["en", "es", "fr", "de"] as const).map((locale) => (
        <fieldset key={locale} className="tr-lang">
          <legend>{LOCALE_NAMES[locale]}</legend>
          {fields.map((f) => (
            <label key={f.key} className="field">
              {f.label}
              {f.long ? (
                <textarea name={`tr.${locale}.${f.key}`} defaultValue={values[locale]?.[f.key] ?? ""} style={{ minHeight: 90 }} />
              ) : (
                <input name={`tr.${locale}.${f.key}`} defaultValue={values[locale]?.[f.key] ?? ""} />
              )}
            </label>
          ))}
        </fieldset>
      ))}
    </details>
  );
}

// Formulário do catálogo: envia para a ação do servidor; as fotos indicadas em `shrink`
// são reduzidas no browser antes de enviar (fotos de telemóvel têm vários MB).
export function useCatalogForm(action: Action, shrink: string[] = []) {
  const [state, formAction, pending] = useActionState(action, undefined);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>, extra?: (fd: FormData) => Promise<void> | void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const key of shrink) {
      const f = fd.get(key);
      if (f instanceof File && f.size > 0 && f.type.startsWith("image/")) fd.set(key, await shrinkImage(f));
    }
    await extra?.(fd);
    startTransition(() => formAction(fd));
  }
  return { state, pending, onSubmit };
}

export function SaveBar({ pending, state, label = "Guardar" }: { pending: boolean; state: FormState; label?: string }) {
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <button className="btn btn-fire" disabled={pending}>{pending ? "A guardar…" : label}</button>
      <FormMessage state={state} />
    </div>
  );
}

// Apagar com confirmação; mostra o motivo se não for possível (ex.: marca com produtos).
export function DeleteForm({ action, id, what }: { action: Action; id: string; what: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Apagar ${what}? Esta ação não pode ser desfeita.`)) e.preventDefault();
      }}
      className="row"
      style={{ alignItems: "center" }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-danger btn-sm" disabled={pending}>{pending ? "A apagar…" : `Apagar ${what}`}</button>
      <FormMessage state={state} />
    </form>
  );
}
