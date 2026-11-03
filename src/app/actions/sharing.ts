"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin, requirePanel } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { panel } from "@/lib/panel";
import { alertAdmins } from "@/lib/staff-alert";
import type { FormState } from "./auth";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O que se partilha/comenta: um cliente com conta, ou um pedido de orçamento (cliente sem conta).
function target(formData: FormData) {
  const clientId = text(formData, "client_id");
  const quoteId = text(formData, "quote_id");
  if (clientId && UUID.test(clientId) && !quoteId) return { client_id: clientId, quote_id: null };
  if (quoteId && UUID.test(quoteId) && !clientId) return { client_id: null, quote_id: quoteId };
  return null;
}

// ── Partilhar (só administrador) ────────────────────────────────────
export async function shareWith(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const t = target(formData);
  const staffId = text(formData, "staff_id");
  if (!t || !UUID.test(staffId)) return { error: "Escolha com quem partilhar." };

  const supabase = await createClient();
  const { error } = await supabase.from("client_shares").insert({ staff_id: staffId, ...t });
  if (error) {
    if (error.code === "23505") return { error: "Já está partilhado com essa pessoa." };
    return { error: "Não foi possível partilhar. Só se partilha com técnicos ou colaboradores." };
  }
  revalidatePath(panel(), "layout");
  return { success: "Partilhado." };
}

export async function unshare(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("client_shares").delete().eq("id", id);
  revalidatePath(panel(), "layout");
}

// ── Comentar (admin, ou quem recebeu a partilha) ────────────────────
export async function addComment(_: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requirePanel();
  const t = target(formData);
  const body = text(formData, "body");
  if (!t) return { error: "Cliente inválido." };
  if (!body) return { error: "Escreva o comentário." };
  if (body.length > 2000) return { error: "O comentário é demasiado longo (máx. 2000 caracteres)." };

  // A base de dados só aceita se esta pessoa tiver acesso ao cliente (partilha) ou for admin.
  const supabase = await createClient();
  const { error } = await supabase.from("client_comments").insert({ ...t, body });
  if (error) return { error: "Não foi possível guardar o comentário." };

  revalidatePath(panel(), "layout");

  // Comentário de um colaborador/técnico → aviso à administração pelo bot de WhatsApp.
  if (profile.role !== "admin") {
    after(async () => {
      const admin = createAdminClient();
      let clientName = "";
      let link = "";
      if (t.client_id) {
        const { data } = await admin.from("profiles").select("full_name, email").eq("id", t.client_id).maybeSingle();
        clientName = data?.full_name || data?.email || "";
        link = panel(`/clientes/${t.client_id}#comentarios`);
      } else if (t.quote_id) {
        const { data } = await admin.from("quote_requests").select("name, profiles!quote_requests_user_id_fkey(full_name)").eq("id", t.quote_id).maybeSingle();
        const account = Array.isArray(data?.profiles) ? data?.profiles[0] : data?.profiles;
        clientName = (account as { full_name?: string } | null)?.full_name || data?.name || "";
        link = panel(`/orcamentos/${t.quote_id}#comentarios`);
      }
      const author = profile.full_name || profile.email;
      await alertAdmins(
        [
          `💬 ${author} deixou um comentário relativo ao cliente '${clientName || "sem nome"}'`,
          "",
          `Ver no backoffice: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${link}`,
        ].join("\n"),
      );
    });
  }

  return { success: "Comentário guardado." };
}

export async function deleteComment(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData, "id"));
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();
  await supabase.from("client_comments").delete().eq("id", id);
  revalidatePath(panel(), "layout");
}
