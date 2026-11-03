import "server-only";
import { escapeHtml, sendMail } from "@/lib/mailer";

// Avisos à equipa: Telegram (instantâneo, gratuito) + cópia por email, sempre.
// Configurar sem mexer no código — ver scripts/avisos.mjs:
//   npm run avisos -- token <token do @BotFather>   (uma vez)
//   npm run avisos -- ligar admin                   (a pessoa carrega em "Start" no bot antes)
//   npm run avisos -- email admin sandra@exemplo.pt
//   npm run avisos -- test admin
// Fica em .env.local:
//   TELEGRAM_BOT_TOKEN=123456:ABC...
//   ADMIN_TELEGRAM / STAFF_TELEGRAM = ids das conversas, separados por vírgula
//   ADMIN_EMAIL / STAFF_EMAIL       = emails, separados por vírgula (precisa do SMTP, ver mailer.ts)
//
// A mensagem não leva dados pessoais do cliente (nome, telefone, morada):
// passa por um serviço externo, por isso só diz que há um pedido e dá o link.
export async function alertStaff(message: string) {
  await Promise.all([telegram(process.env.STAFF_TELEGRAM ?? "", message), mail(process.env.STAFF_EMAIL ?? "", message)]);
}

// Só para a administração (ex.: a Sandra), quando um colaborador comenta um cliente.
// ADMIN_TELEGRAM / ADMIN_EMAIL; se não existirem, usa os da equipa.
export async function alertAdmins(message: string) {
  await Promise.all([
    telegram(process.env.ADMIN_TELEGRAM || process.env.STAFF_TELEGRAM || "", message),
    mail(process.env.ADMIN_EMAIL || process.env.STAFF_EMAIL || "", message),
  ]);
}

async function telegram(list: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = list.split(",").map((c) => c.trim()).filter(Boolean);
  if (!token || !chats.length) {
    console.info("[alerta equipa] Telegram não configurado — mensagem não enviada:\n" + message);
    return;
  }

  await Promise.all(
    chats.map(async (chat_id) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id, text: message, link_preview_options: { is_disabled: true } }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) console.error(`[alerta equipa] Telegram falhou para ${chat_id.slice(0, 4)}…: HTTP ${res.status}`);
      } catch (error) {
        console.error(`[alerta equipa] Telegram falhou para ${chat_id.slice(0, 4)}…`, error);
      }
    }),
  );
}

async function mail(list: string, message: string) {
  const to = list.split(",").map((e) => e.trim()).filter(Boolean);
  if (!to.length) return;
  const subject = message.split("\n")[0].replace(/^[^\p{L}\p{N}]+/u, "").slice(0, 120) || "Aviso do site";
  const html = `<p style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(message).replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>`;
  await sendMail({ to: to.join(", "), subject: `Lareiras Pachinha — ${subject}`, text: message, html });
}
