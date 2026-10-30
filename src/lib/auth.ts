import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { panel } from "@/lib/panel";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "client" | "tecnico" | "admin";
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

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/entrar");
  // Two-step verification turned on but this session hasn't entered the code yet.
  if (current.hasMfa && !current.mfaVerified) redirect("/entrar/verificar");
  return current;
}

// Staff panel. Anyone who isn't staff gets a plain 404, as if the panel didn't exist.
// Staff must always be on a session verified with two-step authentication.
// Signed-out visitors on the exact secret address are sent to the staff login by
// src/proxy.ts; anywhere else they get a 404, so the address is never revealed.
export async function requireStaff() {
  const current = await getCurrentUser();
  if (!current) notFound();
  if (!isStaff(current.profile)) notFound();
  if (!current.mfaVerified) redirect(panel("/entrar"));
  return current;
}

export async function requireAdmin() {
  const current = await requireStaff();
  if (current.profile.role !== "admin") notFound();
  return current;
}
