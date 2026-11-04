import "server-only";
// Envio de emails. Em produção pelo Resend (API por HTTPS — funciona na Cloudflare, onde o SMTP não liga):
//   RESEND_API_KEY=re_...            (resend.com → API Keys; o domínio pachinha.com tem de estar verificado)
//   MAIL_FROM="Lareiras Pachinha <info@pachinha.com>"
//   MAIL_REPLY_TO=sandra.oliveira@pachinha.com   (opcional: as respostas dos clientes vão para aqui)
// Sem Resend, usa SMTP (útil para testar no computador, ex.: Gmail):
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_USER=…  SMTP_PASS=palavra-passe de aplicação  SMTP_FROM=…
// Sem nenhum dos dois, o email não é enviado e aparece só uma linha no terminal.
export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

async function sendWithResend(mail: Mail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: mail.to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      reply_to: mail.replyTo || process.env.MAIL_REPLY_TO || undefined,
      attachments: mail.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        content_type: a.contentType,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function sendWithSmtp(mail: Mail) {
  const { default: nodemailer } = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 465);
  await nodemailer
    .createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    .sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...mail });
}

export async function sendMail(mail: Mail) {
  const resend = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
  const smtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!resend && !smtp) {
    console.info(`[email] envio não configurado — não enviado para ${mail.to}: ${mail.subject}`);
    return false;
  }
  try {
    await (resend ? sendWithResend(mail) : sendWithSmtp(mail));
    return true;
  } catch (error) {
    console.error(`[email] falhou: ${mail.subject}`, error);
    return false;
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
