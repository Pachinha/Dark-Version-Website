"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isInPortugal } from "@/lib/geo";
import { PHOTO_BUCKET } from "@/lib/quote-photos";
import type { FormState } from "./auth";
import { isValidPhone } from "@/lib/phone";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

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
