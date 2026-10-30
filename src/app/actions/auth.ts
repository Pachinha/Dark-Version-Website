"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRIVACY_VERSION } from "@/lib/legal";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";

export type FormState = { error?: string; success?: string } | undefined;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}

// Only allow same-site relative paths, to avoid open redirects.
function safeNext(value: FormDataEntryValue | null, fallback = "/conta") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const acceptedPrivacy = formData.get("privacy") === "on";
  const marketing = formData.get("marketing") === "on";

  if (fullName.length < 2) return { error: "Indique o seu nome." };
  if (!EMAIL_RE.test(email)) return { error: "Indique um email válido." };
  if (password.length < 8) return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  if (!acceptedPrivacy) {
    return { error: "Para criar conta tem de aceitar a Política de Privacidade e os Termos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/conta`,
      data: {
        full_name: fullName,
        phone,
        privacy_version: PRIVACY_VERSION,
        marketing_opt_in: marketing,
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { error: "Palavra-passe demasiado fraca. Use letras, números e símbolos." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente dentro de momentos." };
  }

  // Email confirmation disabled in Supabase → the user is already signed in.
  if (data.session) redirect("/conta");

  return {
    success: "Conta criada! Enviámos um email de confirmação — clique no link para ativar a sua conta.",
  };
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  const cookieStore = await cookies();
  if (remember) cookieStore.delete(REMEMBER_COOKIE);
  else cookieStore.set(REMEMBER_COOKIE, "0", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });

  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Ainda não confirmou o seu email. Verifique a sua caixa de correio." };
    }
    return { error: "Email ou palavra-passe incorretos." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Indique um email válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/confirm?next=/conta/nova-password`,
  });

  // Same answer whether or not the account exists — doesn't reveal who is a client.
  return { success: "Se existir uma conta com este email, receberá um link para definir nova palavra-passe." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  if (password !== confirm) return { error: "As palavras-passe não coincidem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível alterar a palavra-passe. Peça um novo link." };

  return { success: "Palavra-passe alterada com sucesso." };
}
