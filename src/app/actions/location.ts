"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isInPortugal } from "@/lib/geo";
import { applyAddress, contactFor, makeLocationNotice, type Entity } from "@/lib/location-request";
import { panel } from "@/lib/panel";
import { alertAdmins } from "@/lib/staff-alert";
import { createAdminClient } from "@/lib/supabase/server";
import type { EditResult } from "./admin";
import type { FormState } from "./auth";

// Pedir a localização ao cliente: link privado (WhatsApp/email) → o cliente partilha a
// localização → fica gravada no pedido / limpeza / obra e a administração é avisada.

const ENTITIES: Entity[] = ["quote_requests", "maintenance_requests", "jobs"];
const PAGE: Record<Entity, string> = { quote_requests: "/orcamentos/", maintenance_requests: "/manutencao/", jobs: "/obras/" };
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

// Botão "Pedir localização ao cliente" nas fichas do painel.
export async function requestLocation(formData: FormData): Promise<EditResult> {
  const { user } = await requireAdmin();
  const entity = text(formData, "entity") as Entity;
  const id = text(formData, "entity_id");
  if (!ENTITIES.includes(entity)) return { error: "Registo inválido." };
  const notice = await makeLocationNotice(entity, id, user.id);
  if (!notice) return { error: "Não foi possível criar o pedido de localização." };
  if (!notice.phone && !notice.email) return { error: "O cliente não tem telefone nem email — não há como lhe enviar o link." };
  revalidatePath(panel(`${PAGE[entity]}${id}`));
  return { notice };
}

// O cliente partilha a localização (página pública /localizacao/[token]).
export async function submitLocation(_: FormState, formData: FormData): Promise<FormState> {
  const token = text(formData, "token");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { error: "Link inválido." };
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const address = text(formData, "address").slice(0, 300);
  const source = text(formData, "source") === "gps" ? "gps" : "search";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInPortugal(lat, lng) || !address) {
    return { error: "Não foi possível ler a localização. Tente outra vez ou pesquise a morada." };
  }
  const details = text(formData, "address_details").slice(0, 200);
  const postcode = text(formData, "postcode").slice(0, 20);

  const db = createAdminClient();
  const { data: req } = await db.from("location_requests").select("id, entity, entity_id, expires_at, fulfilled_at").eq("token", token).maybeSingle();
  if (!req) return { error: "Este link não existe. Peça-nos um novo." };
  if (req.fulfilled_at) return { error: "Já recebemos a sua localização. Obrigado!" };
  if (new Date(req.expires_at) < new Date()) return { error: "Este link expirou. Peça-nos um novo." };

  const entity = req.entity as Entity;
  const saved = await applyAddress(entity, req.entity_id, { address, details, postcode, locality: text(formData, "locality"), lat, lng });
  if (!saved) return { error: "Não foi possível guardar. Tente outra vez." };
  await db.from("location_requests").update({ fulfilled_at: new Date().toISOString(), address, lat, lng, source }).eq("id", req.id);

  const contact = await contactFor(entity, req.entity_id);
  await alertAdmins(`📍 ${contact?.name || "O cliente"} partilhou a localização: ${address}${details ? ` (${details})` : ""}\n${site()}${panel(`${PAGE[entity]}${req.entity_id}`)}`);
  revalidatePath(panel(), "layout");
  return { success: "Obrigado! Recebemos a sua localização." };
}

// A administração insere a morada à mão (quando o cliente não a deu). Sem GPS: só pesquisa.
export async function setAddressManually(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const entity = text(formData, "entity") as Entity;
  const id = text(formData, "entity_id");
  if (!ENTITIES.includes(entity)) return { error: "Registo inválido." };
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const address = text(formData, "address").slice(0, 300);
  if (!address || !Number.isFinite(lat) || !Number.isFinite(lng) || !isInPortugal(lat, lng)) {
    return { error: "Escolha a morada na pesquisa (tem de ser uma morada real em Portugal)." };
  }
  const saved = await applyAddress(entity, id, {
    address,
    details: text(formData, "address_details").slice(0, 200),
    postcode: text(formData, "postcode").slice(0, 20),
    locality: text(formData, "locality"),
    lat,
    lng,
  });
  if (!saved) return { error: "Não foi possível guardar a morada." };
  revalidatePath(panel(), "layout");
  return {};
}
