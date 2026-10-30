import "server-only";
import { CONTACT_PREFERENCE, WORK_TYPE, describeAvailability, formatDate, quoteRef } from "@/lib/labels";
import { escapeHtml, sendMail } from "@/lib/mailer";

export type QuoteSummary = {
  id: string;
  ref: number;
  created_at: string;
  name: string;
  email: string;
  category: string;
  work_type: string | null;
  municipality: string;
  outside_area: boolean;
  availability: string[];
  contact_preference: string;
  photos: number;
};

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";
export const receiptUrl = (id: string) => `${site()}/pedido/${id}`;

// Email automático ao cliente: confirmação + comprovativo do pedido.
export async function sendQuoteConfirmation(q: QuoteSummary) {
  if (!q.email) return false;
  const ref = quoteRef(q.ref);
  const first = q.name.trim().split(" ")[0];
  const rows: [string, string][] = [
    ["Referência", ref],
    ["Data do pedido", formatDate(q.created_at, true)],
    ["Procura", [q.category, q.work_type && WORK_TYPE[q.work_type]].filter(Boolean).join(" · ")],
    ["Concelho", q.municipality],
    ["Disponibilidade", describeAvailability(q.availability)],
    ["Contacto preferido", CONTACT_PREFERENCE[q.contact_preference] ?? ""],
    ["Fotos enviadas", String(q.photos)],
  ];
  const steps = [
    "Analisamos o seu pedido.",
    `Contactamo-lo por ${(CONTACT_PREFERENCE[q.contact_preference] ?? "telefone").toLowerCase()} para marcar a visita técnica, dentro das suas preferências.`,
    "Fazemos a visita, sem compromisso, e enviamos o orçamento detalhado.",
  ];
  const outside = q.outside_area
    ? "A obra fica fora da nossa zona de visita gratuita (Alto Minho). Se a deslocação tiver custo, dizemos-lhe o valor antes de marcar."
    : "";

  const text = [
    `Olá ${first},`,
    "",
    `Recebemos o seu pedido de orçamento. Guarde este email como comprovativo.`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "O que acontece a seguir:",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    ...(outside ? ["", outside] : []),
    "",
    `Ver o comprovativo e o estado do pedido: ${receiptUrl(q.id)}`,
    "",
    "Se precisar de acrescentar alguma informação, basta responder a este email.",
    "",
    "Com os melhores cumprimentos,",
    "Lareiras Pachinha",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt"><body style="margin:0;background:#f2ece2;font-family:Arial,Helvetica,sans-serif;color:#262019">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ece2;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#1a1108;padding:24px 28px">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e2a276;font-weight:bold">Pedido de orçamento recebido</div>
    <div style="font-size:22px;color:#f2ece2;font-weight:bold;margin-top:6px">Lareiras Pachinha</div>
  </td></tr>
  <tr><td style="padding:28px">
    <p style="margin:0 0 12px;font-size:15px">Olá ${escapeHtml(first)},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55">Recebemos o seu pedido de orçamento. Guarde este email como comprovativo.</p>
    <div style="background:#f2ece2;border-radius:12px;padding:16px 18px;margin-bottom:20px;text-align:center">
      <div style="font-size:12px;color:#6b5f52">Referência do pedido</div>
      <div style="font-size:26px;font-weight:bold;letter-spacing:1px;color:#bf5b2d">${ref}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      ${rows
        .slice(1)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;border-top:1px solid #eee5d8;color:#6b5f52;width:42%">${escapeHtml(k)}</td><td style="padding:8px 0;border-top:1px solid #eee5d8;font-weight:bold">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="margin:24px 0 8px;font-size:15px;font-weight:bold">O que acontece a seguir</p>
    <ol style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.6">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
    ${outside ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;background:#f3e6c4;border-radius:10px;padding:10px 12px">${escapeHtml(outside)}</p>` : ""}
    <p style="margin:24px 0;text-align:center">
      <a href="${receiptUrl(q.id)}" style="display:inline-block;background:#bf5b2d;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 24px;border-radius:999px">Ver comprovativo e estado do pedido</a>
    </p>
    <p style="margin:0;font-size:13px;color:#6b5f52;line-height:1.5">Se precisar de acrescentar alguma informação, basta responder a este email.</p>
  </td></tr>
  <tr><td style="padding:18px 28px;background:#faf7f2;font-size:12px;color:#6b5f52">
    Lareiras Pachinha · Monção · Desde 1992<br>Recebeu este email porque fez um pedido de orçamento em ${escapeHtml(site().replace(/^https?:\/\//, ""))}.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return sendMail({ to: q.email, subject: `Recebemos o seu pedido de orçamento — ${ref}`, text, html });
}
