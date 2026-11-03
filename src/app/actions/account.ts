"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isInPortugal } from "@/lib/geo";
import { PHOTO_BUCKET } from "@/lib/quote-photos";
import { MAINTENANCE_SERVICE, AVAILABILITY_SLOTS, URGENCY, CONTACT_PREFERENCE } from "@/lib/labels";
import type { FormState } from "./auth";
import { isValidPhone } from "@/lib/phone";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function createMaintenance(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireUser();
  const service = text(formData, "service");
  const equipment = text(formData, "equipment");
  const addressId = text(formData, "address_id");
  const preferredDate = text(formData, "preferred_date");
  const notes = text(formData, "notes");
  const availability = formData.getAll("availability").map(String).filter((s) => AVAILABILITY_SLOTS.includes(s));
  const urgency = text(formData, "urgency") || "normal";
  const contactPreference = text(formData, "contact_preference") || "telefone";

  if (!(service in MAINTENANCE_SERVICE)) return { error: "Escolha o tipo de serviço." };
  if (!(urgency in URGENCY)) return { error: "Indique quando precisa do serviço." };
  if (!(contactPreference in CONTACT_PREFERENCE)) return { error: "Escolha como prefere ser contactado." };
  if (equipment.length < 2) return { error: "Indique o equipamento (ex.: recuperador a lenha Solzaima)." };
  if (!addressId) return { error: "Escolha a morada onde será feito o serviço." };
  if (preferredDate && preferredDate < new Date().toISOString().slice(0, 10)) {
    return { error: "A data preferida não pode estar no passado." };
  }

  const phone = text(formData, "phone");
  if (formData.has("phone") && !isValidPhone(phone)) {
    return { error: "Indique um número de telefone válido." };
  }

  const supabase = await createClient();
  if (phone) await supabase.from("profiles").update({ phone }).eq("id", user.id);
  // RLS also ensures the address belongs to this user.
  const { error } = await supabase.from("maintenance_requests").insert({
    user_id: user.id,
    address_id: addressId,
    service,
    equipment,
    preferred_date: preferredDate || null,
    availability,
    urgency,
    contact_preference: contactPreference,
    notes,
  });
  if (error) return { error: "Não foi possível enviar o pedido. Tente novamente." };

  revalidatePath("/conta", "layout");
  return { success: "Pedido enviado! O nosso secretariado vai marcar a visita tendo em conta as suas preferências e contacta-o para confirmar." };
}

export async function addAddress(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireUser();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const source = text(formData, "source");
  const address = text(formData, "address");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !address) {
    return { error: "Escolha uma morada da lista ou use a sua localização." };
  }
  if (!isInPortugal(lat, lng)) return { error: "Só prestamos serviços em Portugal." };
  if (source !== "gps" && source !== "search") return { error: "Morada inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    label: text(formData, "label").slice(0, 60) || "Casa",
    address: address.slice(0, 300),
    details: text(formData, "details").slice(0, 200),
    postcode: text(formData, "postcode").slice(0, 20),
    locality: text(formData, "locality").slice(0, 100),
    lat,
    lng,
    source,
  });
  if (error) return { error: "Não foi possível guardar a morada." };

  revalidatePath("/conta", "layout");
  return { success: "Morada guardada." };
}

export async function deleteAddress(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", text(formData, "id"));
  revalidatePath("/conta", "layout");
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireUser();
  const fullName = text(formData, "full_name");
  const phone = text(formData, "phone");
  const marketing = formData.get("marketing") === "on";

  if (fullName.length < 2) return { error: "Indique o seu nome." };
  if (phone && !isValidPhone(phone)) return { error: "Telefone inválido — confirme o país e o número." };

  const supabase = await createClient();
  const marketingChanged = marketing !== profile.marketing_opt_in;
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      marketing_opt_in: marketing,
      ...(marketingChanged ? { marketing_updated_at: new Date().toISOString() } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: "Não foi possível guardar as alterações." };

  if (marketingChanged) {
    await supabase.from("consent_events").insert({ user_id: user.id, kind: "marketing", granted: marketing });
  }

  revalidatePath("/conta", "layout");
  return { success: "Dados atualizados." };
}

// RGPD art. 17.º — direito ao apagamento. Removes the auth user; every table
// cascades on delete, so all personal data goes with it.
export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireUser();
  if (text(formData, "confirm").toUpperCase() !== "APAGAR") {
    return { error: 'Escreva APAGAR para confirmar.' };
  }

  const admin = createAdminClient();
  const { data: quotes } = await admin.from("quote_requests").select("photos").eq("user_id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Não foi possível apagar a conta. Contacte-nos por email." };

  // Os pedidos de orçamento são apagados com a conta; as fotos também.
  const photos = (quotes ?? []).flatMap((q) => q.photos ?? []);
  if (photos.length) await admin.storage.from(PHOTO_BUCKET).remove(photos);

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?conta=apagada");
}
