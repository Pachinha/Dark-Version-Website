// Creates (or promotes) the admin account and then runs security checks that
// play the part of a malicious client trying to become admin.
//
//   node scripts/create-admin.mjs [email] [--reset]
//
// - Applies supabase/002_painel_admin.sql first if it hasn't been run (needs SUPABASE_ACCESS_TOKEN).
// - New account: a strong random password is generated and copied to the clipboard — never printed.
// - --reset: generate a new password for an existing admin account.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = env.SUPABASE_SECRET_KEY;
if (!URL || !PUBLISHABLE || !SECRET) {
  console.error("✗ Faltam chaves em .env.local — corra primeiro scripts/setup-supabase.mjs");
  process.exit(1);
}

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const email = (args.find((a) => a.includes("@")) ?? "joseprguerra+admin@gmail.com").toLowerCase();
const privacyVersion = readFileSync("src/lib/legal.ts", "utf8").match(/PRIVACY_VERSION = "([^"]+)"/)[1];

const admin = createClient(URL, SECRET, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = () => createClient(URL, PUBLISHABLE, { auth: { autoRefreshToken: false, persistSession: false } });

function strongPassword() {
  // 24 chars, guaranteed upper/lower/digit/symbol
  const base = randomBytes(18).toString("base64url");
  return `${base}Aa7!`;
}

function toClipboard(text) {
  try {
    execSync(process.platform === "win32" ? "clip" : process.platform === "darwin" ? "pbcopy" : "xclip -selection clipboard", { input: text });
    return true;
  } catch {
    return false;
  }
}

// ── 1. Database migrations ───────────────────────────────────────────
async function runSql(file) {
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token?.startsWith("sbp_")) {
    console.error(`✗ Falta correr supabase/${file} no SQL Editor (ou ter o SUPABASE_ACCESS_TOKEN em .env.local).`);
    process.exit(1);
  }
  const ref = new globalThis.URL(URL).hostname.split(".")[0];
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: readFileSync(`supabase/${file}`, "utf8") }),
  });
  if (!res.ok) {
    console.error(`✗ Erro ao aplicar ${file}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  console.log(`✓ Base de dados atualizada (${file})`);
}

if ((await admin.from("jobs").select("id").limit(1)).error) await runSql("002_painel_admin.sql");
if ((await admin.rpc("mfa_ok")).error) await runSql("003_seguranca.sql");
console.log("✓ Base de dados em dia");

// ── 2. Admin account ─────────────────────────────────────────────────
const { data: existing } = await admin.from("profiles").select("id, role").eq("email", email).maybeSingle();
let adminId = existing?.id;

if (!adminId) {
  const password = strongPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Administração Pachinha", privacy_version: privacyVersion, marketing_opt_in: false },
  });
  if (error) {
    console.error(`✗ Não foi possível criar a conta: ${error.message}`);
    process.exit(1);
  }
  adminId = data.user.id;
  console.log(`✓ Conta criada: ${email}`);
  console.log(toClipboard(password)
    ? "✓ Palavra-passe (24 caracteres aleatórios) COPIADA para a área de transferência — cole-a já num local seguro."
    : "✗ Não consegui copiar a palavra-passe. Corra de novo com --reset.");
} else if (reset) {
  const password = strongPassword();
  const { error } = await admin.auth.admin.updateUserById(adminId, { password });
  if (error) throw error;
  console.log(toClipboard(password)
    ? "✓ Nova palavra-passe COPIADA para a área de transferência — cole-a já num local seguro."
    : "✗ Não consegui copiar a palavra-passe.");
} else {
  console.log(`✓ A conta ${email} já existia — palavra-passe mantida (use --reset para gerar uma nova).`);
}

const { error: roleError } = await admin.from("profiles").update({ role: "admin" }).eq("id", adminId);
if (roleError) throw roleError;
console.log("✓ Papel: administrador");

// ── 3. Security checks: a malicious client tries to become admin ────
console.log("\nTestes de segurança (um cliente malicioso a tentar ser admin):");
const testEmail = `teste-seguranca-${randomBytes(4).toString("hex")}@example.com`;
const testPassword = strongPassword();
const { data: t, error: tErr } = await admin.auth.admin.createUser({
  email: testEmail,
  password: testPassword,
  email_confirm: true,
  // Attempt: sneak an admin role in through signup metadata
  user_metadata: { full_name: "Chico Esperto", privacy_version: privacyVersion, role: "admin" },
});
if (tErr) throw tErr;
const attackerId = t.user.id;

const results = [];
const check = (label, passed) => results.push([label, passed]);

try {
  const attacker = anon();
  await attacker.auth.signInWithPassword({ email: testEmail, password: testPassword });

  const roleAfterSignup = (await admin.from("profiles").select("role").eq("id", attackerId).single()).data.role;
  check("Registar-se com \"role: admin\" escondido → fica cliente", roleAfterSignup === "client");

  const upd = await attacker.from("profiles").update({ role: "admin" }).eq("id", attackerId);
  check("Mudar o próprio papel para admin → recusado", Boolean(upd.error));

  const rpc = await attacker.rpc("set_user_role", { target: attackerId, new_role: "admin" });
  check("Usar a função de mudar papéis → recusado", Boolean(rpc.error));

  await attacker.auth.updateUser({ data: { role: "admin" } });
  const roleAfterMeta = (await admin.from("profiles").select("role").eq("id", attackerId).single()).data.role;
  check("Alterar os próprios metadados para admin → continua cliente", roleAfterMeta === "client");

  const profiles = await attacker.from("profiles").select("id");
  check("Ler a lista de clientes → só vê o próprio perfil", profiles.data?.length === 1 && profiles.data[0].id === attackerId);

  const others = await attacker.from("maintenance_requests").select("id").neq("user_id", attackerId);
  check("Ler limpezas de outros clientes → nada", (others.data?.length ?? 0) === 0);

  const job = await attacker.from("jobs").insert({ user_id: attackerId, title: "hack" });
  check("Criar uma obra → recusado", Boolean(job.error));

  const quotes = await attacker.from("quote_requests").update({ status: "fechado" }).neq("user_id", attackerId).select("id");
  check("Alterar orçamentos de outros → nada alterado", (quotes.data?.length ?? 0) === 0);

  const anonymous = await anon().from("profiles").select("id");
  check("Visitante sem sessão ler perfis → nada", Boolean(anonymous.error) || anonymous.data.length === 0);
} finally {
  await admin.auth.admin.deleteUser(attackerId); // clean up the test account
}

// ── 4. Stolen admin password, but no phone code ─────────────────────
const thiefEmail = `teste-admin-${randomBytes(4).toString("hex")}@example.com`;
const { data: th } = await admin.auth.admin.createUser({
  email: thiefEmail,
  password: testPassword,
  email_confirm: true,
  user_metadata: { full_name: "Ladrão de Palavra-passe", privacy_version: privacyVersion },
});
try {
  await admin.from("profiles").update({ role: "admin" }).eq("id", th.user.id);
  const thief = anon();
  await thief.auth.signInWithPassword({ email: thiefEmail, password: testPassword });

  const seen = await thief.from("profiles").select("id");
  check("Admin com a palavra-passe certa mas SEM código 2FA → não vê clientes", seen.data?.length === 1);
  const job = await thief.from("jobs").insert({ user_id: th.user.id, title: "hack" });
  check("Admin sem código 2FA → não cria obras", Boolean(job.error));
  const role = await thief.rpc("set_user_role", { target: attackerId, new_role: "admin" });
  check("Admin sem código 2FA → não muda papéis", Boolean(role.error));
} finally {
  await admin.auth.admin.deleteUser(th.user.id);
}

results.forEach(([label, passed]) => console.log(`  ${passed ? "✓" : "✗ FALHOU:"} ${label}`));
const failed = results.filter(([, p]) => !p).length;
console.log(failed ? `\n✗ ${failed} teste(s) falharam — avise o Claude.` : "\n✓ Todos os testes passaram. Contas de teste apagadas.");
if (env.PANEL_SLUG) {
  console.log(`\nEndereço do painel (guarde nos favoritos, não partilhe): http://localhost:3000/${env.PANEL_SLUG}/entrar`);
}
console.log("\nLembrete: apague o token em https://supabase.com/dashboard/account/tokens quando terminar.");
