"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_NOTE_KIND, one } from "@/lib/labels";
import { SIGNATURE, greeting } from "@/lib/notify";
import { panel } from "@/lib/panel";
import { SHEET_COLUMNS, euro, parseItems, sheetKind, sheetNumber, sheetTotals, type Sheet } from "@/lib/quote-sheet";
import { alertAdmins } from "@/lib/staff-alert";
import type { EditResult } from "./admin";
import type { FormState } from "./auth";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";
const pdfLink = (token: string) => `${site()}/orcamento/${token}`;

type Contact = { name: string; email: string; phone: string; user_id: string | null; profiles: unknown };
function contactOf(q: Contact) {
  const p = one(q.profiles) as { full_name: string; email: string; phone: string } | null;
  return { name: p?.full_name || q.name, email: q.email || p?.email || "", phone: q.phone || p?.phone || "" };
}

// ── Guardar a folha de orçamento (rascunho) ─────────────────────────
// Uma folha já enviada não se altera: guardar cria uma nova versão (novo número).
export async function saveSheet(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const quoteId = text(formData, "quote_id");
  const sheetId = text(formData, "sheet_id");
  const items = parseItems(text(formData, "items"));
  if (!items) return { error: "Verifique as linhas: cada uma precisa de designação, quantidade e preço válidos." };
  if (!items.length) return { error: "Adicione pelo menos uma linha ao orçamento." };
  const vat = Number(text(formData, "vat_rate").replace(",", "."));
  const discount = Number(text(formData, "discount_pct").replace(",", ".") || 0);
  if (!Number.isFinite(vat) || vat < 0 || vat > 100) return { error: "IVA inválido." };
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) return { error: "Desconto inválido." };

  const isQuote = formData.get("is_quote") === "on";
  const isOrder = formData.get("is_order") === "on";
  if (!isQuote && !isOrder) return { error: "Assinale “Orçamento” e/ou “Nota encomenda”." };
  const clientName = text(formData, "client_name");
  if (!clientName) return { error: "Indique o nome do cliente." };

  const fields = {
    items,
    vat_rate: vat,
    discount_pct: discount,
    payment_terms: text(formData, "payment_terms").slice(0, 1000),
    notes: text(formData, "notes").slice(0, 2000),
    is_quote: isQuote,
    is_order: isOrder,
    delivery: text(formData, "delivery").slice(0, 120),
    client_name: clientName.slice(0, 200),
    client_address: text(formData, "client_address").slice(0, 300),
    client_phone: text(formData, "client_phone").slice(0, 40),
    client_nif: text(formData, "client_nif").replace(/\s/g, "").slice(0, 20),
  };

  const supabase = await createClient();
  let id = sheetId;
  const { data: existing } = sheetId
    ? await supabase.from("quote_sheets").select("id, sent_at").eq("id", sheetId).eq("quote_id", quoteId).maybeSingle()
    : { data: null };

  if (existing && !existing.sent_at) {
    const { error } = await supabase.from("quote_sheets").update(fields).eq("id", existing.id);
    if (error) return { error: "Não foi possível guardar a folha." };
  } else {
    const { data, error } = await supabase.from("quote_sheets").insert({ ...fields, quote_id: quoteId }).select("id").single();
    if (error || !data) return { error: "Não foi possível guardar a folha." };
    id = data.id;
  }

  revalidatePath(panel(`/orcamentos/${quoteId}`));
  redirect(panel(`/orcamentos/${quoteId}/folha/${id}`));
}

// ── Enviar a folha ao cliente ───────────────────────────────────────
// Marca como enviada, o pedido passa a "aguarda confirmação", e abre o popup de sempre:
// email automático com o PDF em anexo, ou WhatsApp com o link do PDF.
export async function sendSheet(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: sheet } = await supabase
    .from("quote_sheets")
    .select(`${SHEET_COLUMNS}, quote_requests(id, user_id, ref, category, name, email, phone, profiles!quote_requests_user_id_fkey(full_name, email, phone))`)
    .eq("id", text(formData, "sheet_id"))
    .maybeSingle();
  if (!sheet) return { error: "Folha não encontrada." };
  const s = sheet as unknown as Sheet & { quote_requests: Contact & { id: string; category: string } };
  if (!s.items.length) return { error: "A folha não tem linhas." };

  const sentAt = s.sent_at ?? new Date().toISOString();
  const [{ error }] = await Promise.all([
    supabase.from("quote_sheets").update({ sent_at: sentAt }).eq("id", s.id),
    supabase.from("quote_requests").update({ status: "orcamento_enviado" }).eq("id", s.quote_id).in("status", ["novo", "visita_marcada", "visita_feita", "orcamento_enviado"]),
  ]);
  if (error) return { error: "Não foi possível marcar como enviado." };

  const q = s.quote_requests;
  const client = contactOf(q);
  const { total } = sheetTotals(s);
  revalidatePath(panel(), "layout");
  revalidatePath("/conta", "layout");

  return {
    notice: {
      clientId: q.user_id,
      entity: "quote_requests",
      entityId: q.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      subject: `${sheetKind(s)} n.º ${sheetNumber(s.number)} (${q.category}) — Lareiras Pachinha`,
      sheetId: s.id,
      message: `${greeting(client.name)}

Segue o documento ${sheetKind(s).toLowerCase()} n.º ${sheetNumber(s.number)} para ${q.category}, no valor total de ${euro(total)} (IVA incluído).

Pode ver e descarregar o PDF aqui:
${pdfLink(s.token)}

Se estiver de acordo, responda a esta mensagem e combinamos os próximos passos.${SIGNATURE}`,
    },
    redirectTo: panel(`/orcamentos/${q.id}`),
  };
}

export async function deleteSheet(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const supabase = await createClient();
  const quoteId = text(formData, "quote_id");
  const { error } = await supabase.from("quote_sheets").delete().eq("id", text(formData, "sheet_id")).is("sent_at", null);
  if (error) return { error: "Não foi possível apagar." };
  revalidatePath(panel(`/orcamentos/${quoteId}`));
  return { redirectTo: panel(`/orcamentos/${quoteId}`) };
}

// ── Cliente confirmou → iniciar obra ────────────────────────────────
export async function startJobFromQuote(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const supabase = await createClient();
  const quoteId = text(formData, "quote_id");
  const { data: q } = await supabase
    .from("quote_requests")
    .select("id, user_id, category, name, email, phone, status, profiles!quote_requests_user_id_fkey(full_name, email, phone)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!q) return { error: "Pedido não encontrado." };

  const { data: existing } = await supabase.from("jobs").select("id").eq("quote_id", quoteId).limit(1).maybeSingle();
  if (existing) return { redirectTo: panel(`/obras/${existing.id}`) };

  const { data: sheet } = await supabase
    .from("quote_sheets")
    .select(SHEET_COLUMNS)
    .eq("quote_id", quoteId)
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle<Sheet>();

  const client = contactOf(q as Contact);
  const description = sheet
    ? `${sheetKind(sheet)} n.º ${sheetNumber(sheet.number)} confirmado pelo cliente (${euro(sheetTotals(sheet).total)}):\n` +
      sheet.items.map((i) => `• ${String(i.qty).replace(".", ",")} × ${i.description}`).join("\n")
    : "";

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({ user_id: q.user_id, quote_id: q.id, title: q.category.slice(0, 200), description, status: "por_agendar" })
    .select("id")
    .single();
  if (error || !job) return { error: "Não foi possível criar a obra." };

  await supabase.from("quote_requests").update({ status: "em_obra" }).eq("id", q.id);
  revalidatePath(panel(), "layout");
  revalidatePath("/conta", "layout");
  return { redirectTo: panel(`/obras/${job.id}`) };
}

// ── Notas de obra ───────────────────────────────────────────────────
// A equipa adiciona notas (material, alterações). A administração recebe sempre aviso
// no Telegram; só a administração decide se avisa o cliente.
export async function addJobNote(_: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireStaff();
  const jobId = text(formData, "job_id");
  const kind = text(formData, "kind");
  const body = text(formData, "body");
  if (!(kind in JOB_NOTE_KIND)) return { error: "Escolha o tipo de nota." };
  if (!body) return { error: "Escreva a nota." };
  if (body.length > 2000) return { error: "A nota é demasiado longa (máx. 2000 caracteres)." };

  const supabase = await createClient();
  const { error } = await supabase.from("job_notes").insert({ job_id: jobId, kind, body });
  if (error) return { error: "Não foi possível guardar a nota." };

  if (profile.role !== "admin") {
    const { data: job } = await supabase.from("jobs").select("title").eq("id", jobId).maybeSingle();
    const author = profile.full_name || profile.email;
    await alertAdmins(
      `🔧 ${author} adicionou uma nota (${JOB_NOTE_KIND[kind].toLowerCase()}) na obra '${job?.title ?? ""}':\n${body.slice(0, 500)}\n\n${site()}${panel(`/obras/${jobId}`)}`,
    );
  }
  revalidatePath(panel(`/obras/${jobId}`));
  return { success: "Nota guardada." };
}

export async function deleteJobNote(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("job_notes").delete().eq("id", text(formData, "note_id"));
  revalidatePath(panel(`/obras/${text(formData, "job_id")}`));
}

// Só a administração: avisar o cliente de uma alteração na obra (abre o popup email/WhatsApp).
export async function notifyJobNote(formData: FormData): Promise<EditResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("job_notes")
    .select("id, body, job_id, jobs(id, title, user_id, name, email, phone, profiles!jobs_user_id_fkey(full_name, email, phone), quote_requests(name, email, phone, user_id, profiles!quote_requests_user_id_fkey(full_name, email, phone)))")
    .eq("id", text(formData, "note_id"))
    .maybeSingle();
  const job = one(note?.jobs) as { id: string; title: string; user_id: string | null; name: string; email: string; phone: string; profiles: unknown; quote_requests: unknown } | null;
  if (!note || !job) return { error: "Nota não encontrada." };

  const account = one(job.profiles) as { full_name: string; email: string; phone: string } | null;
  const quote = one(job.quote_requests) as Contact | null;
  const client = account
    ? { name: account.full_name, email: account.email, phone: account.phone }
    : job.name ? { name: job.name, email: job.email, phone: job.phone } // obra registada sem conta
    : quote ? contactOf(quote) : null;
  if (!client) return { error: "Esta obra não tem contactos do cliente." };

  await supabase.from("job_notes").update({ client_notified_at: new Date().toISOString() }).eq("id", note.id);
  revalidatePath(panel(`/obras/${job.id}`));

  return {
    notice: {
      clientId: job.user_id,
      entity: "jobs",
      entityId: job.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      subject: `Obra: ${job.title} — Lareiras Pachinha`,
      message: `${greeting(client.name)}

Informamos que a sua obra "${job.title}" teve uma alteração:

${note.body}

Se tiver alguma dúvida, responda a esta mensagem.${SIGNATURE}`,
    },
  };
}
