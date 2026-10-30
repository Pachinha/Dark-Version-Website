"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  JOB_STATUS,
  MAINTENANCE_SERVICE,
  MAINTENANCE_STATUS,
  ORDER_STATUS,
  QUOTE_STATUS,
  formatDate,
  formatTime,
  fromLocalInput,
} from "@/lib/labels";
import { SIGNATURE, greeting, type Notice } from "@/lib/notify";
import type { FormState } from "./auth";
import { panel } from "@/lib/panel";

export type EditResult = { error?: string; notice?: Notice; redirectTo?: string } | undefined;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const accountLink = () => `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/conta`;

type ClientRow = { full_name: string; email: string; phone: string } | null;
type AddressRow = { address: string; details: string } | null;

function notice(
  entity: Notice["entity"],
  entityId: string,
  clientId: string,
  client: ClientRow,
  subject: string,
  body: string,
): Notice {
  return {
    clientId,
    entity,
    entityId,
    name: client?.full_name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    subject,
    message: `${greeting(client?.full_name ?? "")}\n\n${body}\n\nPode acompanhar tudo na sua área de cliente: ${accountLink()}${SIGNATURE}`,
  };
}

const where = (a: AddressRow) => (a ? `${a.address}${a.details ? ` (${a.details})` : ""}` : "");
const when = (iso: string | null) => (iso ? `${formatDate(iso)} às ${formatTime(iso)}` : "");

function done(paths: string[]) {
  paths.forEach((p) => revalidatePath(p, "layout"));
}

// ── Orçamentos ──────────────────────────────────────────────────────
type QuoteRow = {
  id: string;
  user_id: string | null;
  category: string;
  status: string;
  admin_reply: string | null;
  visit_at: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  municipality: string;
  profiles: ClientRow;
};

export async function updateQuote(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!(status in QUOTE_STATUS)) return { error: "Estado inválido." };
  const visitAt = fromLocalInput(text(formData, "visit_at"));
  if (status === "visita_marcada" && !visitAt) return { error: "Indique a data e hora da visita." };

  const supabase = await createClient();
  const { data: q, error } = await supabase
    .from("quote_requests")
    .update({ status, visit_at: visitAt, admin_reply: text(formData, "admin_reply") || null })
    .eq("id", id)
    .select("id, user_id, category, status, admin_reply, visit_at, name, email, phone, address, municipality, profiles(full_name, email, phone)")
    .single<QuoteRow>();
  if (error || !q) return { error: "Não foi possível guardar." };

  done([panel(), "/conta"]);

  // Pedido feito sem conta: os contactos estão no próprio pedido.
  const client = q.profiles ?? { full_name: q.name, email: q.email, phone: q.phone };
  const place = [q.address, q.municipality].filter(Boolean).join(", ");
  const body =
    status === "visita_marcada" && q.visit_at
      ? `A visita técnica para o seu orçamento (${q.category}) ficou marcada para ${when(q.visit_at)}${place ? `, na morada ${place}` : ""}.

Se não puder nessa data, responda a esta mensagem.`
      : status === "orcamento_enviado" && q.admin_reply
        ? `Segue o seu orçamento (${q.category}):

${q.admin_reply}`
        : status === "aceite"
          ? `Obrigado pela confiança! Vamos entrar em contacto para combinar a data da instalação.`
          : `O seu pedido de orçamento (${q.category}) passou para o estado: ${QUOTE_STATUS[status]}.`;
  const followUp = q.user_id ? `

Pode acompanhar tudo na sua área de cliente: ${accountLink()}` : "";
  return {
    notice: {
      clientId: q.user_id,
      entity: "quote_requests",
      entityId: q.id,
      name: client.full_name || q.name,
      email: client.email || q.email,
      phone: client.phone || q.phone,
      subject: `Orçamento ${q.category} — Lareiras Pachinha`,
      message: `${greeting(client.full_name || q.name)}

${body}${followUp}${SIGNATURE}`,
    },
  };
}

// ── Manutenções / limpezas ──────────────────────────────────────────
export async function updateMaintenance(formData: FormData): Promise<EditResult> {
  const { profile } = await requireStaff();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!(status in MAINTENANCE_STATUS)) return { error: "Estado inválido." };

  const changes: Record<string, unknown> = { status, admin_notes: text(formData, "admin_notes") || null };
  if (profile.role === "admin") {
    const duration = Number(text(formData, "duration_minutes") || 120);
    if (!Number.isInteger(duration) || duration < 15 || duration > 1440) return { error: "Duração inválida." };
    changes.scheduled_for = fromLocalInput(text(formData, "scheduled_for"));
    changes.duration_minutes = duration;
    changes.technician_id = text(formData, "technician_id") || null;
    if (status === "agendado" && !changes.scheduled_for) return { error: "Indique a data e hora da visita." };
  }

  const supabase = await createClient();
  const { data: m, error } = await supabase
    .from("maintenance_requests")
    .update(changes)
    .eq("id", id)
    .select("id, user_id, service, scheduled_for, profiles!maintenance_requests_user_id_fkey(full_name, email, phone), addresses(address, details)")
    .single<{ id: string; user_id: string; service: string; scheduled_for: string | null; profiles: ClientRow; addresses: AddressRow }>();
  if (error || !m) return { error: "Não foi possível guardar." };

  done([panel(), "/conta"]);
  const service = MAINTENANCE_SERVICE[m.service];
  const body =
    status === "agendado" && m.scheduled_for
      ? `A sua ${service.toLowerCase()} está agendada para ${when(m.scheduled_for)}${m.addresses ? `, na morada ${where(m.addresses)}` : ""}.\n\nSe não puder nessa data, responda a esta mensagem.`
      : status === "concluido"
        ? `A sua ${service.toLowerCase()} foi concluída. Obrigado pela confiança!`
        : status === "cancelado"
          ? `A sua ${service.toLowerCase()} foi cancelada. Contacte-nos se quiser marcar outra data.`
          : `O seu pedido de ${service.toLowerCase()} passou para o estado: ${MAINTENANCE_STATUS[status]}.`;
  return { notice: notice("maintenance_requests", m.id, m.user_id, m.profiles, `${service} — Lareiras Pachinha`, body) };
}

// ── Obras / instalações ─────────────────────────────────────────────
type JobRow = {
  id: string;
  user_id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  profiles: ClientRow;
  addresses: AddressRow;
};
const JOB_SELECT =
  "id, user_id, title, status, scheduled_start, scheduled_end, profiles!jobs_user_id_fkey(full_name, email, phone), addresses(address, details)";

function jobNotice(j: JobRow, created = false) {
  const body =
    j.status === "agendado" && j.scheduled_start
      ? `${created ? "Agendámos" : "Atualizámos a data d"}a sua obra "${j.title}": início a ${when(j.scheduled_start)}${
          j.scheduled_end ? `, com conclusão prevista a ${formatDate(j.scheduled_end)}` : ""
        }${j.addresses ? `, na morada ${where(j.addresses)}` : ""}.`
      : j.status === "concluido"
        ? `A sua obra "${j.title}" foi concluída. Obrigado pela confiança!`
        : j.status === "cancelado"
          ? `A obra "${j.title}" foi cancelada. Contacte-nos para qualquer esclarecimento.`
          : `A sua obra "${j.title}" passou para o estado: ${JOB_STATUS[j.status]}.`;
  return notice("jobs", j.id, j.user_id, j.profiles, `Obra: ${j.title} — Lareiras Pachinha`, body);
}

function jobFields(formData: FormData) {
  const status = text(formData, "status");
  const start = fromLocalInput(text(formData, "scheduled_start"));
  const end = fromLocalInput(text(formData, "scheduled_end"));
  if (!(status in JOB_STATUS)) return { error: "Estado inválido." } as const;
  if (status === "agendado" && !start) return { error: "Indique a data de início." } as const;
  if (start && end && end < start) return { error: "A data de fim é anterior ao início." } as const;
  const title = text(formData, "title");
  if (title.length < 2) return { error: "Indique o título da obra." } as const;
  return {
    fields: {
      title,
      description: text(formData, "description"),
      status,
      scheduled_start: start,
      scheduled_end: end,
      address_id: text(formData, "address_id") || null,
      technician_id: text(formData, "technician_id") || null,
      client_notes: text(formData, "client_notes") || null,
      internal_notes: text(formData, "internal_notes") || null,
    },
  } as const;
}

export async function createJob(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const parsed = jobFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data: j, error } = await supabase
    .from("jobs")
    .insert({ ...parsed.fields, user_id: text(formData, "user_id"), quote_id: text(formData, "quote_id") || null })
    .select(JOB_SELECT)
    .single<JobRow>();
  if (error || !j) return { error: "Não foi possível criar a obra." };

  done([panel(), "/conta"]);
  return { notice: jobNotice(j, true), redirectTo: panel(`/obras/${j.id}`) };
}

export async function updateJob(formData: FormData): Promise<EditResult> {
  const { profile } = await requireStaff();
  const parsed = jobFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Technicians may only change status and notes (also enforced in the database).
  const { status, client_notes, internal_notes } = parsed.fields;
  const changes = profile.role === "admin" ? parsed.fields : { status, client_notes, internal_notes };

  const supabase = await createClient();
  const { data: j, error } = await supabase
    .from("jobs")
    .update(changes)
    .eq("id", text(formData, "id"))
    .select(JOB_SELECT)
    .single<JobRow>();
  if (error || !j) return { error: "Não foi possível guardar." };

  done([panel(), "/conta"]);
  return { notice: jobNotice(j) };
}

export async function deleteJob(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", text(formData, "id"));
  if (error) return { error: "Não foi possível apagar." };
  done([panel(), "/conta"]);
  return { redirectTo: panel("/obras") };
}

// ── Registo de notificações ─────────────────────────────────────────
export async function logNotification(n: Notice, channel: "email" | "whatsapp") {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    client_id: n.clientId,
    entity: n.entity,
    entity_id: n.entityId,
    channel,
    message: n.message,
  });
  revalidatePath(panel(), "layout");
}

// ── Equipa ──────────────────────────────────────────────────────────
export async function setUserRole(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", {
    target: text(formData, "id"),
    new_role: text(formData, "role"),
  });
  if (error) return { error: "Não foi possível alterar o papel." };
  revalidatePath(panel(), "layout");
  return {};
}

// ── Encomendas ──────────────────────────────────────────────────────
export async function createOrder(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const description = text(formData, "description");
  const status = text(formData, "status");
  if (description.length < 2) return { error: "Descreva a encomenda." };
  if (!(status in ORDER_STATUS)) return { error: "Estado inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    user_id: text(formData, "user_id"),
    description,
    status,
    order_date: text(formData, "order_date") || undefined,
  });
  if (error) return { error: "Não foi possível criar a encomenda." };

  revalidatePath(panel(), "layout");
  return { success: "Encomenda registada." };
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const status = text(formData, "status");
  if (!(status in ORDER_STATUS)) return;

  const supabase = await createClient();
  await supabase.from("orders").update({ status }).eq("id", text(formData, "id"));
  revalidatePath(panel(), "layout");
}
