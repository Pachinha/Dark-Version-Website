"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { panel } from "@/lib/panel";
import { isValidPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

// Fichas de cliente (supabase/016): criadas e ligadas aos pedidos automaticamente pela base de
// dados. Aqui a administração só corrige contactos, escreve notas e junta fichas repetidas.

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateCustomer(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const notes = text(formData, "notes");
  if (!UUID.test(id)) return { error: "Ficha inválida." };
  if (name.length < 2 || name.length > 120) return { error: "Indique o nome do cliente." };
  if (phone && !isValidPhone(phone)) return { error: "Telefone inválido — confirme o país e o número." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido." };
  if (notes.length > 4000) return { error: "As notas são demasiado longas." };

  const supabase = await createClient();
  const { data: c } = await supabase.from("customers").select("user_id").eq("id", id).maybeSingle();
  if (!c) return { error: "Ficha não encontrada." };
  // Numa ficha com conta, nome e contactos são os da conta (o cliente muda-os na área de cliente).
  const patch = c.user_id ? { notes } : { name, phone, email, notes };
  const { error } = await supabase.from("customers").update(patch).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  revalidatePath(panel("/clientes"), "layout");
  return { success: "Ficha guardada." };
}

// Junta "other" em "keep": os pedidos, orçamentos e obras passam todos para a ficha que fica.
export async function mergeCustomers(formData: FormData) {
  await requireAdmin();
  const keep = text(formData, "keep");
  const other = text(formData, "other");
  if (!UUID.test(keep) || !UUID.test(other)) redirect(panel("/clientes/repetidos?erro=1"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("merge_customers", { keep, other });
  if (error) {
    console.error("[juntar fichas]", error.message);
    redirect(panel(`/clientes/repetidos?erro=${error.message.includes("account") ? "contas" : "1"}`));
  }
  revalidatePath(panel("/clientes"), "layout");
  redirect(panel(`/clientes/${keep}?juntado=1`));
}

// "São pessoas diferentes": o par deixa de aparecer nos possíveis repetidos.
export async function markNotDuplicates(formData: FormData) {
  await requireAdmin();
  const [a, b] = [text(formData, "a"), text(formData, "b")].sort();
  if (!UUID.test(a) || !UUID.test(b) || a === b) redirect(panel("/clientes/repetidos?erro=1"));
  const supabase = await createClient();
  await supabase.from("customer_not_duplicates").upsert({ a, b }, { onConflict: "a,b", ignoreDuplicates: true });
  revalidatePath(panel("/clientes"), "layout");
  redirect(panel("/clientes/repetidos"));
}
