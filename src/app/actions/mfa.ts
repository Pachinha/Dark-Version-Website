"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

export type EnrollStart = { factorId: string; qr: string; secret: string } | { error: string };

const CODE_RE = /^\d{6}$/;

function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

// Step 1 of turning on two-step verification: returns a QR code for the authenticator app.
export async function startEnroll(): Promise<EnrollStart> {
  const current = await getCurrentUser();
  if (!current) return { error: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();
  // Remove abandoned, never-confirmed attempts so they don't pile up.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Lareiras Pachinha",
    friendlyName: `Autenticador ${new Date().toISOString().slice(0, 16)}`,
  });
  if (error || !data) return { error: "Não foi possível iniciar a ativação. Tente novamente." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

// Step 2: the user types the first code from the app; this also upgrades the session to aal2.
export async function confirmEnroll(_: FormState, formData: FormData): Promise<FormState> {
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!CODE_RE.test(code)) return { error: "O código tem 6 dígitos." };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { error: "Código incorreto ou expirado. Use o código que aparece agora na app." };

  revalidatePath("/", "layout");
  const next = formData.get("next");
  if (next) redirect(safeNext(next, "/conta"));
  return { success: "Verificação em dois passos ativada." };
}

// At login: check the 6-digit code for an account that already has it turned on.
export async function verifyCode(_: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!CODE_RE.test(code)) return { error: "O código tem 6 dígitos." };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === "verified");
  if (!factor) return { error: "Esta conta não tem verificação em dois passos ativa." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: "Código incorreto ou expirado. Use o código que aparece agora na app." };

  redirect(safeNext(formData.get("next"), "/conta"));
}

// Clients may turn it off again; staff may not (it is mandatory for them).
export async function disableMfa(): Promise<FormState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Sessão expirada." };
  if (isStaff(current.profile)) return { error: "Para a equipa, a verificação em dois passos é obrigatória." };
  if (!current.mfaVerified) return { error: "Confirme primeiro o código da app." };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) await supabase.auth.mfa.unenroll({ factorId: f.id });
  await supabase.auth.refreshSession(); // drop back to a normal session

  revalidatePath("/conta", "layout");
  return { success: "Verificação em dois passos desativada." };
}
