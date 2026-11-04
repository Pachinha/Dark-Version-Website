// Builds the client notification shown after an admin change. Email is sent by the
// server (Resend or SMTP, see lib/mailer.ts and emailClient); WhatsApp opens the admin's app with the text ready.

export type Notice = {
  clientId: string | null; // null = pedido feito sem conta
  entity: "quote_requests" | "maintenance_requests" | "jobs";
  entityId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  sheetId?: string; // folha de orçamento: o email leva o PDF em anexo
};

// Portuguese numbers: "912 345 678" → "351912345678". Returns "" if unusable.
export function whatsappNumber(phone: string) {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 9) digits = `351${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : "";
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(email: string, subject: string, message: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

export function greeting(fullName: string) {
  const first = fullName.trim().split(" ")[0];
  return first ? `Olá ${first},` : "Olá,";
}

export const SIGNATURE = "\n\nCom os melhores cumprimentos,\nLareiras Pachinha";

// WhatsApp da empresa para os clientes (NEXT_PUBLIC_COMPANY_WHATSAPP em .env.local, ex.: 351912345678).
export function companyWhatsappUrl(message: string) {
  const number = whatsappNumber(process.env.NEXT_PUBLIC_COMPANY_WHATSAPP ?? "");
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "";
}
