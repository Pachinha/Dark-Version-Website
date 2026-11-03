// Gerir quem recebe os avisos do site (Telegram + cópia por email) — sem mexer no código.
//
//   npm run avisos                                  → ver o que está configurado
//   npm run avisos -- token 123456:ABC-xyz          → guardar o token do bot (dado pelo @BotFather)
//   npm run avisos -- ligar admin                   → junta quem carregou em "Start" no bot há pouco
//   npm run avisos -- remover admin 123456789       → tira essa conversa do grupo
//   npm run avisos -- email admin sandra@exemplo.pt → cópia por email (vários: a@x.pt,b@y.pt; "-" para desligar)
//   npm run avisos -- test admin                    → envia um aviso de teste (Telegram + email)
//
// Grupos:
//   admin  — avisos de comentários dos colaboradores (ex.: a Sandra)
//   equipa — avisos de novos pedidos de orçamento
//
// Grava em .env.local. Em produção, copiar os mesmos valores para o alojamento (ex.: Vercel → Environment Variables).
import { readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const TELEGRAM = { admin: "ADMIN_TELEGRAM", equipa: "STAFF_TELEGRAM" };
const EMAILS = { admin: "ADMIN_EMAIL", equipa: "STAFF_EMAIL" };

let env = readFileSync(ENV_FILE, "utf8");
const get = (key) => (env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^"|"$/g, "");
const save = (key, value) => {
  env = new RegExp(`^${key}=.*$`, "m").test(env)
    ? env.replace(new RegExp(`^${key}=.*$`, "m"), () => `${key}=${value}`)
    : `${env.trimEnd()}\n${key}=${value}\n`;
  writeFileSync(ENV_FILE, env);
};
const list = (key) => get(key).split(",").map((s) => s.trim()).filter(Boolean);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
function group(name) {
  if (!TELEGRAM[name]) fail(`Grupo desconhecido: "${name ?? ""}". Use "admin" ou "equipa".`);
  return name;
}
async function bot(method, body) {
  const token = get("TELEGRAM_BOT_TOKEN");
  if (!token) fail("Falta o token do bot. Use primeiro: npm run avisos -- token <token do @BotFather>");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  if (!data.ok) fail(`Telegram: ${data.description}`);
  return data.result;
}
const who = (chat) => [chat.first_name, chat.last_name].filter(Boolean).join(" ") + (chat.username ? ` (@${chat.username})` : "");

const [command = "list", groupName, arg] = process.argv.slice(2);

if (command === "list") {
  const token = get("TELEGRAM_BOT_TOKEN");
  console.log(`Bot do Telegram: ${token ? `@${(await bot("getMe")).username}` : "não configurado"}`);
  for (const name of Object.keys(TELEGRAM)) {
    const chats = list(TELEGRAM[name]);
    const emails = get(EMAILS[name]);
    const fallback = name === "admin" ? " (vazio → usa o da equipa)" : "";
    console.log(`${name}:`);
    console.log(`  Telegram: ${chats.length ? chats.join(", ") : `ninguém${fallback}`}`);
    console.log(`  email:    ${emails || `nenhum${fallback}`}`);
  }
  if (!get("SMTP_HOST")) console.log("\n⚠ SMTP não configurado — as cópias por email não saem (ver src/lib/mailer.ts).");
} else if (command === "token") {
  const token = groupName ?? "";
  if (!/^\d+:[\w-]{30,}$/.test(token)) fail("Token inválido. É algo como 123456789:AAH4k... (dado pelo @BotFather).");
  save("TELEGRAM_BOT_TOKEN", token);
  const me = await bot("getMe");
  console.log(`✓ Bot @${me.username} guardado. Cada pessoa abre https://t.me/${me.username}, carrega em "Start", e depois: npm run avisos -- ligar admin`);
} else if (command === "ligar") {
  const key = TELEGRAM[group(groupName)];
  const updates = await bot("getUpdates", { allowed_updates: ["message"] });
  const chat = updates.map((u) => u.message?.chat).filter((c) => c?.type === "private").at(-1);
  if (!chat) fail(`Ninguém escreveu ao bot recentemente. A pessoa deve abrir o bot, carregar em "Start" (ou enviar "olá") e voltar a correr este comando.`);
  const id = String(chat.id);
  save(key, [...list(key).filter((c) => c !== id), id].join(","));
  await bot("sendMessage", { chat_id: id, text: `✅ Ligado aos avisos do site Lareiras Pachinha (${groupName}).` });
  console.log(`✓ ${who(chat)} [${id}] passa a receber os avisos de ${groupName}. Recebeu uma confirmação no Telegram.`);
} else if (command === "remover") {
  const key = TELEGRAM[group(groupName)];
  if (!list(key).includes(String(arg))) fail(`${arg ?? ""} não está no grupo ${groupName}. Veja os ids com: npm run avisos`);
  save(key, list(key).filter((c) => c !== String(arg)).join(","));
  console.log(`✓ ${arg} removido de ${groupName}.`);
} else if (command === "email") {
  group(groupName);
  const value = arg === "-" ? "" : String(arg ?? "").split(",").map((e) => e.trim()).filter(Boolean).join(",");
  if (arg !== "-" && !value.split(",").every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))
    fail(`Email inválido: "${arg ?? ""}". Ex.: npm run avisos -- email ${groupName} sandra@exemplo.pt`);
  save(EMAILS[groupName], value);
  console.log(value ? `✓ ${groupName}: cópia por email para ${value}.` : `✓ ${groupName}: sem cópia por email.`);
} else if (command === "test") {
  group(groupName);
  const pick = (map) => get(map[groupName]) || (groupName === "admin" ? get(map.equipa) : "");
  const text = `✅ Teste do site Lareiras Pachinha — os avisos (${groupName}) estão a funcionar.`;

  const chats = pick(TELEGRAM).split(",").map((s) => s.trim()).filter(Boolean);
  if (!chats.length) console.log(`· ${groupName}: ninguém no Telegram. Use: npm run avisos -- ligar ${groupName}`);
  for (const chat_id of chats) {
    await bot("sendMessage", { chat_id, text });
    console.log(`✓ Telegram enviado para ${chat_id}`);
  }

  const to = pick(EMAILS);
  if (!to) console.log(`· ${groupName}: sem cópia por email.`);
  else if (!get("SMTP_HOST") || !get("SMTP_USER") || !get("SMTP_PASS")) console.log(`✗ email para ${to}: SMTP não configurado.`);
  else {
    const { default: nodemailer } = await import("nodemailer");
    const port = Number(get("SMTP_PORT") || 465);
    const transport = nodemailer.createTransport({ host: get("SMTP_HOST"), port, secure: port === 465, auth: { user: get("SMTP_USER"), pass: get("SMTP_PASS") } });
    try {
      await transport.sendMail({ from: get("SMTP_FROM") || get("SMTP_USER"), to, subject: `Lareiras Pachinha — teste dos avisos (${groupName})`, text });
      console.log(`✓ email enviado para ${to}`);
    } catch (error) {
      console.log(`✗ email para ${to}: ${error.message}`);
    }
  }
} else {
  fail(`Comando desconhecido: "${command}". Use list, token, ligar, remover, email ou test.`);
}
