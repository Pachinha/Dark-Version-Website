import "server-only";
import { one } from "@/lib/labels";
import { SIGNATURE, greeting, type Notice } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/server";
import { isInFreeArea, municipalityFromPostcode } from "@/lib/service-area";

// Pedido de localização ao cliente (só no servidor — nunca exportar de um ficheiro "use server").
export type Entity = "quote_requests" | "maintenance_requests" | "jobs";
const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";
const locationLink = (token: string) => `${site()}/localizacao/${token}`;

type Contact = { userId: string | null; name: string; email: string; phone: string; label: string };

// Nome e contactos do cliente do registo (com conta, sem conta, ou do pedido de origem da obra).
export async function contactFor(entity: Entity, id: string): Promise<Contact | null> {
  const db = createAdminClient();
  type P = { full_name: string; email: string; phone: string } | null;
  if (entity === "quote_requests") {
    const { data: q } = await db.from("quote_requests").select("user_id, name, email, phone, category, profiles!quote_requests_user_id_fkey(full_name, email, phone)").eq("id", id).maybeSingle();
    if (!q) return null;
    const p = one(q.profiles) as P;
    return { userId: q.user_id, name: p?.full_name || q.name, email: q.email || p?.email || "", phone: q.phone || p?.phone || "", label: `o seu pedido de orçamento (${q.category})` };
  }
  if (entity === "maintenance_requests") {
    const { data: m } = await db.from("maintenance_requests").select("user_id, name, email, phone, service, profiles!maintenance_requests_user_id_fkey(full_name, email, phone)").eq("id", id).maybeSingle();
    if (!m) return null;
    const p = one(m.profiles) as P;
    return { userId: m.user_id, name: p?.full_name || m.name, email: p?.email || m.email, phone: p?.phone || m.phone, label: "a limpeza/manutenção que vamos fazer" };
  }
  const { data: j } = await db.from("jobs").select("user_id, title, name, email, phone, profiles!jobs_user_id_fkey(full_name, email, phone), quote_requests(name, email, phone)").eq("id", id).maybeSingle();
  if (!j) return null;
  const p = one(j.profiles) as P;
  const q = one(j.quote_requests) as { name: string; email: string; phone: string } | null;
  return {
    userId: j.user_id,
    name: p?.full_name || j.name || q?.name || "",
    email: p?.email || j.email || q?.email || "",
    phone: p?.phone || j.phone || q?.phone || "",
    label: `a sua obra "${j.title}"`,
  };
}

// Cria o link e devolve a mensagem para o popup de sempre (email automático / WhatsApp).
export async function makeLocationNotice(entity: Entity, id: string, createdBy: string, intro = ""): Promise<Notice | null> {
  const contact = await contactFor(entity, id);
  if (!contact) return null;
  const { data: req } = await createAdminClient()
    .from("location_requests")
    .insert({ entity, entity_id: id, created_by: createdBy })
    .select("token")
    .single();
  if (!req) return null;
  return {
    clientId: contact.userId,
    entity,
    entityId: id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    subject: "Localização para a nossa visita — Lareiras Pachinha",
    message: `${greeting(contact.name)}

${intro}Para a nossa equipa chegar sem enganos, pode partilhar a localização da morada para ${contact.label}? Basta abrir este link quando estiver no local e carregar em “Partilhar localização”:
${locationLink(req.token)}

Se preferir, no mesmo link pode pesquisar a morada.${SIGNATURE}`,
  };
}


// Grava a morada no registo (pelo cliente, via link, ou pela administração à mão).
// Pedidos de orçamento: também o concelho (pelo código postal). Limpezas/obras: deixam de
// usar a morada guardada da conta e passam a usar esta.
export async function applyAddress(
  entity: Entity,
  id: string,
  p: { address: string; details: string; postcode: string; locality: string; lat: number; lng: number },
) {
  const details = p.details ? { address_details: p.details.slice(0, 200) } : {};
  let fields: Record<string, unknown>;
  if (entity === "quote_requests") {
    const municipality = municipalityFromPostcode(p.postcode);
    fields = {
      address: p.address, lat: p.lat, lng: p.lng, postcode: p.postcode.slice(0, 20), locality: p.locality.slice(0, 120), ...details,
      ...(municipality ? { municipality, outside_area: !isInFreeArea(municipality) } : {}),
    };
  } else {
    fields = { address: p.address, lat: p.lat, lng: p.lng, address_id: null, ...details };
  }
  const { error } = await createAdminClient().from(entity).update(fields).eq("id", id);
  return !error;
}
