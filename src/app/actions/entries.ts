"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { isInPortugal } from "@/lib/geo";
import { MAINTENANCE_SERVICE, formatDate, formatTime, fromLocalInput } from "@/lib/labels";
import { SIGNATURE, greeting, type Notice } from "@/lib/notify";
import { panel } from "@/lib/panel";
import { isInFreeArea, municipalityFromPostcode } from "@/lib/service-area";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { makeLocationNotice } from "@/lib/location-request";
import type { EditResult } from "./admin";
import { isValidPhone } from "@/lib/phone";

// A administração regista tudo sozinha no painel: pedidos de orçamento, visitas técnicas,
// limpezas/manutenções e obras — para clientes com conta ou para quem aparece na loja / liga.

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const when = (iso: string) => `${formatDate(iso)} às ${formatTime(iso)}`;

export type ClientAddress = { id: string; label: string; address: string; details: string; lat: number; lng: number };

// Moradas guardadas de um cliente com conta (para escolher no formulário).
export async function clientAddresses(userId: string): Promise<ClientAddress[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("addresses").select("id, label, address, details, lat, lng").eq("user_id", userId).order("created_at");
  return (data ?? []) as ClientAddress[];
}

type Place = { address: string; details: string; postcode: string; lat: number | null; lng: number | null };

export async function createEntry(formData: FormData): Promise<EditResult> {
  const { user } = await requireAdmin();
  const kind = text(formData, "kind");
  if (!["orcamento", "visita", "manutencao", "obra"].includes(kind)) return { error: "Escolha o tipo de registo." };

  // ── Cliente ──
  const supabase = await createClient();
  const userId = text(formData, "user_id") || null;
  let contact = { name: text(formData, "name"), email: text(formData, "email").toLowerCase(), phone: text(formData, "phone") };
  if (userId) {
    const { data: p } = await supabase.from("profiles").select("full_name, email, phone").eq("id", userId).eq("role", "client").maybeSingle();
    if (!p) return { error: "Cliente não encontrado." };
    contact = { name: p.full_name, email: p.email, phone: p.phone ?? "" };
  } else {
    if (contact.name.length < 2) return { error: "Indique o nome do cliente." };
    if (!contact.phone && !contact.email) return { error: "Indique pelo menos um contacto do cliente (telefone ou email)." };
    if (contact.phone && !isValidPhone(contact.phone)) return { error: "Telefone inválido — confirme o país e o número." };
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return { error: "Email inválido." };
  }

  // ── Morada: uma das moradas guardadas do cliente, ou uma morada nova verificada ──
  let addressId: string | null = null;
  let place: Place | null = null;
  const savedId = text(formData, "address_id");
  if (userId && savedId) {
    const { data: a } = await supabase.from("addresses").select("id, address, details, postcode, lat, lng").eq("id", savedId).eq("user_id", userId).maybeSingle();
    if (!a) return { error: "Morada inválida." };
    addressId = a.id;
    place = { address: a.address, details: a.details ?? "", postcode: a.postcode ?? "", lat: a.lat, lng: a.lng };
  } else if (text(formData, "address")) {
    const lat = Number(formData.get("lat"));
    const lng = Number(formData.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInPortugal(lat, lng)) return { error: "Escolha a morada na pesquisa (tem de ser uma morada real em Portugal)." };
    place = { address: text(formData, "address").slice(0, 300), details: text(formData, "address_details").slice(0, 200), postcode: text(formData, "postcode").slice(0, 20), lat, lng };
  }
  // "Não sei a morada": cria sem morada e a mensagem para o cliente leva o link de localização.
  const askLocation = formData.get("ask_location") === "on";
  if (askLocation) {
    if (!contact.phone && !contact.email) return { error: "Para pedir a localização, o cliente precisa de telefone ou email." };
    addressId = null;
    place = null;
  } else if (kind !== "orcamento" && !place) return { error: "Indique a morada onde a equipa se vai deslocar (ou peça a localização ao cliente)." };

  const technician = text(formData, "technician_id") || null;
  const admin = createAdminClient(); // inserção pelo servidor, depois de confirmar que é administrador (2FA)
  const where = place ? `, na morada ${place.address}${place.details ? ` (${place.details})` : ""}` : "";
  const base = { clientId: userId, name: contact.name, email: contact.email, phone: contact.phone };
  const finish = async (entity: "quote_requests" | "maintenance_requests" | "jobs", id: string, redirectTo: string, notice?: Notice): Promise<EditResult> => {
    [panel(), "/conta"].forEach((p) => revalidatePath(p, "layout"));
    if (askLocation) {
      // A mensagem de localização inclui a marcação (se houver) numa só mensagem.
      const intro = notice ? `${notice.message.split("\n\n")[1]}\n\n` : "";
      const loc = await makeLocationNotice(entity, id, user.id, intro);
      return { redirectTo, notice: loc ?? notice };
    }
    return { redirectTo, notice };
  };

  // ── Pedido de orçamento / visita técnica ──
  if (kind === "orcamento" || kind === "visita") {
    const category = text(formData, "category");
    if (!QUOTE_CATEGORIES.includes(category)) return { error: "Escolha o tipo de equipamento." };
    const visitAt = kind === "visita" ? fromLocalInput(text(formData, "visit_at")) : null;
    if (kind === "visita" && !visitAt) return { error: "Indique a data e hora da visita." };
    const municipality = place ? municipalityFromPostcode(place.postcode) : "";
    const { data: q, error } = await admin
      .from("quote_requests")
      .insert({
        user_id: userId,
        category,
        message: text(formData, "message").slice(0, 2000),
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        municipality,
        outside_area: municipality ? !isInFreeArea(municipality) : false,
        address: place?.address ?? "",
        address_details: place?.details ?? "",
        postcode: place?.postcode ?? "",
        lat: place?.lat ?? null,
        lng: place?.lng ?? null,
        status: kind === "visita" ? "visita_marcada" : "novo",
        visit_at: visitAt,
        technician_id: technician,
        contact_preference: "telefone",
        privacy_version: null, // registado pela equipa (o cliente não aceitou a política online)
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !q) return { error: "Não foi possível criar o pedido." };
    const notice: Notice | undefined = visitAt
      ? {
          ...base, entity: "quote_requests", entityId: q.id,
          subject: `Visita técnica (${category}) — Lareiras Pachinha`,
          message: `${greeting(contact.name)}\n\nConfirmamos a visita técnica para o seu orçamento (${category}) no dia ${when(visitAt)}${where}.\n\nSe não puder nessa data, responda a esta mensagem.${SIGNATURE}`,
        }
      : undefined;
    return finish("quote_requests", q.id, panel(`/orcamentos/${q.id}`), notice);
  }

  // ── Limpeza / manutenção ──
  if (kind === "manutencao") {
    const service = text(formData, "service");
    if (!(service in MAINTENANCE_SERVICE)) return { error: "Escolha o serviço." };
    const equipment = text(formData, "equipment");
    if (!equipment) return { error: "Indique o equipamento (ex.: recuperador a lenha)." };
    const scheduled = fromLocalInput(text(formData, "scheduled_for"));
    const duration = Number(text(formData, "duration_minutes") || 120);
    if (!Number.isInteger(duration) || duration < 15 || duration > 1440) return { error: "Duração inválida." };
    const { data: m, error } = await admin
      .from("maintenance_requests")
      .insert({
        user_id: userId,
        address_id: addressId,
        service,
        equipment: equipment.slice(0, 200),
        notes: text(formData, "notes").slice(0, 2000),
        status: scheduled ? "agendado" : "pendente",
        scheduled_for: scheduled,
        duration_minutes: duration,
        technician_id: technician,
        name: userId ? "" : contact.name,
        email: userId ? "" : contact.email,
        phone: userId ? "" : contact.phone,
        address: place && !addressId ? place.address : "",
        address_details: place && !addressId ? place.details : "",
        lat: place && !addressId ? place.lat : null,
        lng: place && !addressId ? place.lng : null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !m) return { error: "Não foi possível criar a limpeza/manutenção." };
    const notice: Notice | undefined = scheduled
      ? {
          ...base, entity: "maintenance_requests", entityId: m.id,
          subject: `${MAINTENANCE_SERVICE[service]} — Lareiras Pachinha`,
          message: `${greeting(contact.name)}\n\nConfirmamos a ${MAINTENANCE_SERVICE[service].toLowerCase()} no dia ${when(scheduled)}${where}.\n\nSe não puder nessa data, responda a esta mensagem.${SIGNATURE}`,
        }
      : undefined;
    return finish("maintenance_requests", m.id, panel(`/manutencao/${m.id}`), notice);
  }

  // ── Obra ──
  const title = text(formData, "title");
  if (title.length < 2) return { error: "Indique o título da obra." };
  const start = fromLocalInput(text(formData, "scheduled_start"));
  const end = fromLocalInput(text(formData, "scheduled_end"));
  if (start && end && end < start) return { error: "A data de fim é anterior ao início." };
  const { data: j, error } = await admin
    .from("jobs")
    .insert({
      user_id: userId,
      address_id: addressId,
      title: title.slice(0, 200),
      description: text(formData, "description").slice(0, 4000),
      status: start ? "agendado" : "por_agendar",
      scheduled_start: start,
      scheduled_end: end,
      technician_id: technician,
      name: userId ? "" : contact.name,
      email: userId ? "" : contact.email,
      phone: userId ? "" : contact.phone,
      address: place && !addressId ? place.address : "",
      address_details: place && !addressId ? place.details : "",
      lat: place && !addressId ? place.lat : null,
      lng: place && !addressId ? place.lng : null,
    })
    .select("id")
    .single();
  if (error || !j) return { error: "Não foi possível criar a obra." };
  const notice: Notice | undefined = start
    ? {
        ...base, entity: "jobs", entityId: j.id,
        subject: `Obra: ${title} — Lareiras Pachinha`,
        message: `${greeting(contact.name)}\n\nAgendámos a sua obra "${title}": início a ${when(start)}${end ? `, com conclusão prevista a ${formatDate(end)}` : ""}${where}.\n\nSe tiver alguma dúvida, responda a esta mensagem.${SIGNATURE}`,
      }
    : undefined;
  return finish("jobs", j.id, panel(`/obras/${j.id}`), notice);
}
