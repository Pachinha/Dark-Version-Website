// One-off local setup: reads SUPABASE_ACCESS_TOKEN from .env.local, fills in the
// project keys, configures auth for local testing and checks the schema.
// Run:  node scripts/setup-supabase.mjs [project-ref]
// Never prints secret values.
import { readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";
let env = readFileSync(ENV_FILE, "utf8");
const get = (key) => (env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^"|"$/g, "");
const set = (key, value) => {
  env = new RegExp(`^${key}=.*$`, "m").test(env)
    ? env.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`)
    : `${env.trimEnd()}\n${key}=${value}\n`;
};

const token = get("SUPABASE_ACCESS_TOKEN");
if (!token.startsWith("sbp_")) {
  console.error("✗ SUPABASE_ACCESS_TOKEN em .env.local está vazio ou não começa por sbp_.");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

// 1. Project
const projects = await api("/projects");
const wanted = process.argv[2];
const project = wanted ? projects.find((p) => p.id === wanted || p.ref === wanted) : projects.length === 1 ? projects[0] : null;
if (!project) {
  console.log("Encontrei vários projetos. Corra de novo com o ref do projeto certo:");
  projects.forEach((p) => console.log(`  ${p.id ?? p.ref}  ${p.name}  (${p.region})`));
  process.exit(1);
}
const ref = project.id ?? project.ref;
console.log(`✓ Projeto: ${project.name} (${project.region})`);

// 2. Keys
const keys = await api(`/projects/${ref}/api-keys?reveal=true`);
const publishable = keys.find((k) => k.type === "publishable")?.api_key ?? keys.find((k) => k.name === "anon")?.api_key;
const secret = keys.find((k) => k.type === "secret" && k.api_key)?.api_key ?? keys.find((k) => k.name === "service_role")?.api_key;
if (!publishable || !secret) throw new Error("Não consegui obter as chaves do projeto.");
set("NEXT_PUBLIC_SUPABASE_URL", `https://${ref}.supabase.co`);
set("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishable);
set("SUPABASE_SECRET_KEY", secret);
writeFileSync(ENV_FILE, env);
console.log("✓ Chaves escritas em .env.local");

// 3. Auth settings for local testing
const auth = await api(`/projects/${ref}/config/auth`);
const redirect = "http://localhost:3000/auth/confirm";
const allowList = (auth.uri_allow_list ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (!allowList.includes(redirect)) allowList.push(redirect);
await api(`/projects/${ref}/config/auth`, {
  method: "PATCH",
  body: JSON.stringify({
    site_url: "http://localhost:3000",
    uri_allow_list: allowList.join(","),
    mailer_autoconfirm: true, // TESTES: sem confirmação de email. Desligar antes de publicar.
    password_min_length: 8,
  }),
});
console.log("✓ Redirect URL adicionado e confirmação de email desligada (só para testes)");

// 4. Schema check
const rows = await api(`/projects/${ref}/database/query`, {
  method: "POST",
  body: JSON.stringify({
    query: "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  }),
});
const expected = ["addresses", "consent_events", "maintenance_requests", "orders", "profiles", "quote_requests"];
const found = rows.map((r) => r.table_name);
const missing = expected.filter((t) => !found.includes(t));
console.log(missing.length ? `✗ Faltam tabelas: ${missing.join(", ")} — corra o schema.sql no SQL Editor` : "✓ As 6 tabelas existem");

console.log("\nTudo pronto. Pode apagar o token em https://supabase.com/dashboard/account/tokens");
