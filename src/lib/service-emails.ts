import "server-only";
import { CONTACT_PREFERENCE, MAINTENANCE_SERVICE, URGENCY, describeAvailability, formatDate } from "@/lib/labels";
import { escapeHtml, sendMail } from "@/lib/mailer";

// Email automático ao cliente depois de pedir limpeza/manutenção/assistência no site.
// (Os emails para clientes são sempre em português.)
export type ServiceSummary = {
  name: string;
  email: string;
  service: string;
  equipment: string;
  address: string;
  urgency: string;
  availability: string[];
  preferred_date: string | null;
  contact_preference: string;
  created_at: string;
};

export async function sendServiceConfirmation(s: ServiceSummary) {
  if (!s.email) return false;
  const first = s.name.trim().split(" ")[0];
  const by = (CONTACT_PREFERENCE[s.contact_preference] ?? "telefone").toLowerCase();
  const rows: [string, string][] = [
    ["Data do pedido", formatDate(s.created_at, true)],
    ["Serviço", MAINTENANCE_SERVICE[s.service] ?? s.service],
    ["Equipamento", s.equipment],
    ["Morada", s.address],
    ["Quando", `${URGENCY[s.urgency]?.label ?? ""} · ${describeAvailability(s.availability)}`],
    ...(s.preferred_date ? [["A partir de", formatDate(s.preferred_date)] as [string, string]] : []),
    ["Contacto preferido", CONTACT_PREFERENCE[s.contact_preference] ?? ""],
  ];
  const steps = [
    "O secretariado marca a visita dentro das suas preferências, de acordo com a agenda dos técnicos.",
    `Contactamo-lo por ${by} com o dia e a hora.`,
    "A visita só fica confirmada depois desse contacto.",
  ];

  const text = [
    `Olá ${first},`,
    "",
    "Recebemos o seu pedido. Guarde este email como comprovativo.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "O que acontece a seguir:",
    ...steps.map((x, i) => `${i + 1}. ${x}`),
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
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e2a276;font-weight:bold">Pedido recebido</div>
    <div style="font-size:22px;color:#f2ece2;font-weight:bold;margin-top:6px">Lareiras Pachinha</div>
  </td></tr>
  <tr><td style="padding:28px">
    <p style="margin:0 0 12px;font-size:15px">Olá ${escapeHtml(first)},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55">Recebemos o seu pedido. Guarde este email como comprovativo.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:20px">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b5f52;width:42%;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0;font-weight:bold">${escapeHtml(v)}</td></tr>`).join("")}
    </table>
    <p style="margin:0 0 8px;font-size:15px;font-weight:bold">O que acontece a seguir</p>
    <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.6">
      ${steps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}
    </ol>
    <p style="margin:0;font-size:14px;line-height:1.55;color:#6b5f52">Se precisar de acrescentar alguma informação, basta responder a este email.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return sendMail({ to: s.email, subject: `Pedido recebido: ${MAINTENANCE_SERVICE[s.service] ?? "assistência"} — Lareiras Pachinha`, text, html });
}
