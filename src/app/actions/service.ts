"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isInPortugal } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/server";
import { AVAILABILITY_SLOTS, CONTACT_PREFERENCE, MAINTENANCE_SERVICE, URGENCY } from "@/lib/labels";
import { PRIVACY_VERSION } from "@/lib/legal";
import { panel } from "@/lib/panel";
import { isValidPhone } from "@/lib/phone";
import { municipalityFromPostcode } from "@/lib/service-area";
import { sendServiceConfirmation } from "@/lib/service-emails";
import { alertStaff } from "@/lib/staff-alert";
import { LOCALE_NAMES } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export type ServiceState = { error?: string; success?: boolean; emailSent?: boolean } | undefined;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// Pedido de limpeza / manutenção / assistência feito no site — com ou sem conta.
// Sem conta: nome, telefone, morada verificada e política de privacidade aceite.
// A ficha do cliente é encontrada/criada pela base de dados (supabase/016).
export async function submitService(_: ServiceState, formData: FormData): Promise<ServiceState> {
  // Campo escondido que só robôs preenchem.
  if (text(formData, "website")) return { success: true };

  const { locale, t } = await getI18n();
  const e = { ...t.quote.errors, ...t.service.errors };
  const current = await getCurrentUser();

  const service = text(formData, "service");
  const equipment = text(formData, "equipment");
  const urgency = text(formData, "urgency") || "normal";
  const availability = formData.getAll("availability").map(String).filter((s) => AVAILABILITY_SLOTS.includes(s));
  const preferredDate = text(formData, "preferred_date");
  const contactPreference = text(formData, "contact_preference") || "telefone";
  const notes = text(formData, "notes");
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const savedId = text(formData, "address_id");
  const address = text(formData, "address");
  const addressDetails = text(formData, "address_details");
  const postcode = text(formData, "postcode").slice(0, 20);
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));

  if (!(service in MAINTENANCE_SERVICE)) return { error: e.service };
  if (equipment.length < 2 || equipment.length > 200) return { error: e.equipment };
  if (!(urgency in URGENCY)) return { error: e.generic };
  if (preferredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || preferredDate < new Date().toISOString().slice(0, 10))) {
    return { error: e.date };
  }
  if (!(contactPreference in CONTACT_PREFERENCE)) return { error: e.contactPref };
  if (name.length < 2 || name.length > 120) return { error: e.name };
  if (!isValidPhone(phone)) return { error: e.phone };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: e.email };
  if (contactPreference === "email" && !email) return { error: e.emailNeeded };
  if (notes.length > 2000) return { error: e.messageLong };
  if (addressDetails.length > 200) return { error: e.detailsLong };
  if (!current && text(formData, "privacy") !== "on") return { error: e.privacy };

  const admin = createAdminClient();

  // Morada: uma das moradas guardadas da conta, ou uma morada real da pesquisa (com coordenadas).
  let addressId: string | null = null;
  let place = { address, details: addressDetails, postcode, lat, lng };
  if (current && savedId) {
    const { data: a } = await admin
      .from("addresses")
      .select("id, address, details, postcode, lat, lng")
      .eq("id", savedId)
      .eq("user_id", current.user.id)
      .maybeSingle();
    if (!a) return { error: e.placeServer };
    addressId = a.id;
    place = { address: a.address, details: addressDetails || a.details || "", postcode: a.postcode ?? "", lat: a.lat, lng: a.lng };
  } else if (address.length < 5 || address.length > 300 || !Number.isFinite(lat) || !Number.isFinite(lng) || !isInPortugal(lat, lng)) {
    return { error: e.placeServer };
  }

  // Travão contra envios repetidos: no máximo 3 pedidos por hora para o mesmo telefone.
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await admin
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: e.tooMany };

  const municipality = municipalityFromPostcode(place.postcode);
  const { data: saved, error } = await admin
    .from("maintenance_requests")
    .insert({
      user_id: current?.user.id ?? null,
      address_id: addressId,
      service,
      equipment,
      preferred_date: preferredDate || null,
      availability,
      urgency,
      contact_preference: contactPreference,
      notes,
      name,
      phone,
      email,
      // Morada no próprio pedido (também quando vem de uma morada guardada: fica o registo da altura).
      address: place.address.slice(0, 300),
      address_details: place.details.slice(0, 200),
      lat: place.lat,
      lng: place.lng,
      postcode: place.postcode,
      municipality,
      privacy_version: current ? current.profile.privacy_version : PRIVACY_VERSION,
    })
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();
  if (error || !saved) {
    console.error("[pedido de assistência]", error?.message);
    return { error: e.generic };
  }

  // Quem tem conta e ainda não tinha telefone fica com ele guardado.
  if (current && !current.profile.phone) await admin.from("profiles").update({ phone }).eq("id", current.user.id);

  after(async () => {
    await Promise.all([
      sendServiceConfirmation({
        name,
        email,
        service,
        equipment,
        address: [place.address, place.details].filter(Boolean).join(" — "),
        urgency,
        availability,
        preferred_date: preferredDate || null,
        contact_preference: contactPreference,
        created_at: saved.created_at,
      }),
      alertStaff(
        [
          `${urgency === "urgente" ? "🚨" : "🔧"} Novo pedido: ${MAINTENANCE_SERVICE[service]}${urgency === "urgente" ? " (URGENTE)" : ""}`,
          [municipality, current ? "cliente com conta" : "sem conta"].filter(Boolean).join(" · "),
          ...(locale !== "pt" ? [`🌍 Pedido feito no site em ${LOCALE_NAMES[locale]}`] : []),
          "",
          `Ver no backoffice: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${panel(`/manutencao/${saved.id}`)}`,
        ].join("\n"),
      ),
    ]);
  });

  revalidatePath("/conta", "layout");
  revalidatePath(panel(), "layout");
  return { success: true, emailSent: Boolean(email) };
}
