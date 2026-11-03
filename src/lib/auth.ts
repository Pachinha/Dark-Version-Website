import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { panel } from "@/lib/panel";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "client" | "colaborador" | "tecnico" | "admin";
  privacy_version: string;
  privacy_accepted_at: string;
  marketing_opt_in: boolean;
  created_at: string;
};

// Data Access Layer: verified against the Supabase Auth server, memoized per request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: aal }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!profile) return null;

  const hasMfa = aal?.nextLevel === "aal2";
  const mfaVerified = aal?.currentLevel === "aal2";
  return { user, profile, hasMfa, mfaVerified };
});

export function isStaff(profile: Profile) {
  return profile.role === "admin" || profile.role === "tecnico";
}

// Quem entra no painel: a equipa e os colaboradores (estes só consultam o que lhes é partilhado).
export function isPanelMember(profile: Profile) {
  return isStaff(profile) || profile.role === "colaborador";
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/entrar");
  // Two-step verification turned on but this session hasn't entered the code yet.
  if (current.hasMfa && !current.mfaVerified) redirect("/entrar/verificar");
  return current;
}

// Staff panel. These guards only run on the secret address (src/app/[painel]/layout.tsx
// already 404s every other one), so whoever gets here knows it exists: instead of a
// dead-end 404 they get a page that explains what happened and how to get out.
// Staff must always be on a session verified with two-step authentication.
export async function requireStaff() {
  const current = await getCurrentUser();
  if (!current) redirect(panel("/entrar"));
  if (!isStaff(current.profile)) redirect(panel(current.profile.role === "colaborador" ? "/partilhados" : "/sem-acesso"));
  if (!current.mfaVerified) redirect(panel("/entrar"));
  return current;
}

// Qualquer pessoa do painel, incluindo colaboradores (só leitura dos clientes partilhados).
export async function requirePanel() {
  const current = await getCurrentUser();
  if (!current) redirect(panel("/entrar"));
  if (!isPanelMember(current.profile)) redirect(panel("/sem-acesso"));
  if (!current.mfaVerified) redirect(panel("/entrar"));
  return current;
}

export async function requireAdmin() {
  const current = await requireStaff();
  if (current.profile.role !== "admin") redirect(panel("/sem-acesso?motivo=admin"));
  return current;
}
