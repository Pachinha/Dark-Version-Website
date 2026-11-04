"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isInPortugal } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/server";
import {
  AVAILABILITY_SLOTS,
  CHIMNEY,
  CONTACT_PREFERENCE,
  FUEL,
  HOME_TYPE,
  QUOTE_PRODUCTS,
  WORK_TYPE,
  quoteRef,
} from "@/lib/labels";
import { PRIVACY_VERSION } from "@/lib/legal";
import { panel } from "@/lib/panel";
import { PHOTO_BUCKET } from "@/lib/quote-photos";
import { FREE_VISIT_MUNICIPALITIES, OTHER_MUNICIPALITY, isInFreeArea } from "@/lib/service-area";
import { alertStaff } from "@/lib/staff-alert";
import { sendQuoteConfirmation } from "@/lib/quote-emails";
import { isValidPhone } from "@/lib/phone";
import { LOCALE_NAMES, fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export type QuoteState = { error?: string; success?: boolean; id?: string; ref?: number; emailSent?: boolean } | undefined;

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optional = (value: string, allowed: Record<string, unknown>) => (value in allowed ? value : null);

export async function submitQuote(_: QuoteState, formData: FormData): Promise<QuoteState> {
  // Campo escondido que só robôs preenchem.
  if (text(formData, "website")) return { success: true };

  // Mensagens de erro na língua da página onde o pedido foi feito.
  const { locale, t } = await getI18n();
  const e = t.quote.errors;

  const current = await getCurrentUser();
  const category = text(formData, "category");
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const contactPreference = text(formData, "contact_preference") || "telefone";
  const chosenMunicipality = text(formData, "municipality");
  const otherMunicipality = text(formData, "other_municipality");
  const municipality = chosenMunicipality === OTHER_MUNICIPALITY ? otherMunicipality : chosenMunicipality;
  const address = text(formData, "address");
  const addressDetails = text(formData, "address_details");
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));
  const message = text(formData, "message");
  const area = Number(text(formData, "area_m2") || 0);
  const availability = formData.getAll("availability").map(String).filter((s) => AVAILABILITY_SLOTS.includes(s));
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!(category in QUOTE_PRODUCTS)) return { error: e.category };
  if (name.length < 2) return { error: e.name };
  if (!isValidPhone(phone)) return { error: e.phone };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: e.email };
  if (!(contactPreference in CONTACT_PREFERENCE)) return { error: e.contactPref };
  if (contactPreference === "email" && !email) return { error: e.emailNeeded };
  if (!FREE_VISIT_MUNICIPALITIES.includes(chosenMunicipality) && chosenMunicipality !== OTHER_MUNICIPALITY) {
    return { error: e.municipality };
  }
  if (municipality.length < 2) return { error: e.otherMunicipality };
  // A morada vem da pesquisa de moradas reais (OpenStreetMap), sempre com coordenadas em Portugal.
  if (address.length < 5 || address.length > 300 || !Number.isFinite(lat) || !Number.isFinite(lng) || !isInPortugal(lat, lng)) {
    return { error: e.placeServer };
  }
  if (addressDetails.length > 200) return { error: e.detailsLong };
  if (area && (!Number.isInteger(area) || area < 5 || area > 2000)) return { error: e.area };
  if (message.length > 4000) return { error: e.messageLong };
  if (photos.length > MAX_PHOTOS) return { error: fmt(e.maxPhotos, { max: MAX_PHOTOS }) };
  for (const photo of photos) {
    if (!(photo.type in PHOTO_TYPES)) return { error: e.photoType };
    if (photo.size > MAX_PHOTO_BYTES) return { error: e.photoSize };
  }
  if (!current && text(formData, "privacy") !== "on") {
    return { error: e.privacy };
  }

  const admin = createAdminClient();

  // Pedido feito a partir da página de um modelo: fica identificado no início da mensagem.
  const productSlug = text(formData, "product_slug");
  const { data: product } = productSlug
    ? await admin.from("catalog_products").select("slug, name, catalog_brands(name)").eq("slug", productSlug).maybeSingle<{ slug: string; name: string; catalog_brands: { name: string } | null }>()
    : { data: null };
  const productLine = product
    ? `Equipamento escolhido no site: ${product.catalog_brands?.name ?? ""} ${product.name} — ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/produto/${product.slug}`.trim()
    : "";

  // Travão contra envios repetidos: no máximo 3 pedidos por hora para o mesmo telefone.
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await admin
    .from("quote_requests")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: e.tooMany };

  const id = crypto.randomUUID();
  const paths: string[] = [];
  for (const [i, photo] of photos.entries()) {
    const path = `${id}/${i + 1}.${PHOTO_TYPES[photo.type]}`;
    const { error } = await admin.storage.from(PHOTO_BUCKET).upload(path, photo, { contentType: photo.type });
    if (error) {
      if (paths.length) await admin.storage.from(PHOTO_BUCKET).remove(paths);
      return { error: e.photoUpload };
    }
    paths.push(path);
  }

  const outsideArea = !isInFreeArea(municipality);
  const { data: saved, error } = await admin.from("quote_requests").insert({
    id,
    user_id: current?.user.id ?? null,
    category,
    message: [productLine, message].filter(Boolean).join("\n\n").slice(0, 4000),
    name,
    phone,
    email,
    work_type: optional(text(formData, "work_type"), WORK_TYPE),
    home_type: optional(text(formData, "home_type"), HOME_TYPE),
    chimney: optional(text(formData, "chimney"), CHIMNEY),
    fuel: optional(text(formData, "fuel"), FUEL),
    area_m2: area || null,
    municipality,
    address,
    address_details: addressDetails,
    postcode: text(formData, "postcode").slice(0, 20),
    locality: text(formData, "locality").slice(0, 120),
    lat,
    lng,
    outside_area: outsideArea,
    availability,
    contact_preference: contactPreference,
    photos: paths,
    privacy_version: current ? current.profile.privacy_version : PRIVACY_VERSION,
  }).select("ref, created_at").single<{ ref: number; created_at: string }>();
  if (error || !saved) {
    if (paths.length) await admin.storage.from(PHOTO_BUCKET).remove(paths);
    console.error("[pedido de orçamento]", error?.message);
    return { error: e.generic };
  }

  const workType = text(formData, "work_type");
  const ref = quoteRef(saved.ref);

  // Depois de responder ao cliente (não o faz esperar): email de confirmação + aviso à equipa.
  after(async () => {
    await Promise.all([
      sendQuoteConfirmation({
        id,
        ref: saved.ref,
        created_at: saved.created_at,
        name,
        email,
        category,
        work_type: workType in WORK_TYPE ? workType : null,
        municipality,
        outside_area: outsideArea,
        availability,
        contact_preference: contactPreference,
        photos: paths.length,
      }),
      alertStaff(
        [
          `🔥 Novo pedido de orçamento ${ref}`,
          `${category}${workType in WORK_TYPE ? ` · ${WORK_TYPE[workType]}` : ""}`,
          ...(product ? [`Modelo: ${product.catalog_brands?.name ?? ""} ${product.name}`.trim()] : []),
          `${municipality}${outsideArea ? " (fora da zona gratuita)" : ""}${paths.length ? ` · ${paths.length} foto${paths.length > 1 ? "s" : ""}` : ""}`,
          // Pedido feito no site noutra língua: a equipa sabe em que língua responder.
          ...(locale !== "pt" ? [`🌍 Pedido feito no site em ${LOCALE_NAMES[locale]}`] : []),
          "",
          `Ver no backoffice: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${panel(`/orcamentos/${id}`)}`,
        ].join("\n"),
      ),
    ]);
  });

  revalidatePath("/conta", "layout");
  revalidatePath(panel(), "layout");
  return { success: true, id, ref: saved.ref, emailSent: Boolean(email) };
}
