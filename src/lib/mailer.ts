import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Envio de emails por SMTP. Funciona com o email da empresa ou, para testar, com o Gmail:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_USER=o-seu-email@gmail.com
//   SMTP_PASS=palavra-passe de aplicação (Conta Google → Segurança → Palavras-passe de apps)
//   SMTP_FROM="Lareiras Pachinha <o-seu-email@gmail.com>"
// Sem SMTP configurado, o email não é enviado e o conteúdo aparece no terminal.
export type Mail = { to: string; subject: string; text: string; html: string; replyTo?: string };

let transport: Transporter | null = null;

function getTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

export async function sendMail(mail: Mail) {
  const t = getTransport();
  if (!t) {
    console.info(`[email] SMTP não configurado — não enviado para ${mail.to}: ${mail.subject}`);
    return false;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...mail });
    return true;
  } catch (error) {
    console.error(`[email] falhou: ${mail.subject}`, error);
    return false;
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
