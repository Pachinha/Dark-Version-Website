// Descarrega todos os ficheiros do Supabase Storage (todos os buckets) para uma pasta local.
// Usado pela cópia de segurança diária (.github/workflows/backup.yml); também corre no computador.
//
//   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/backup-storage.mjs <pasta-destino>
//   (sem variáveis, lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY do .env.local)
//
// Só usa fetch — não precisa de npm install. Nunca escreve chaves no ecrã.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const fromEnvFile = () => {
  if (!existsSync(".env.local")) return {};
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
};
const file = fromEnvFile();
const URL_ = (process.env.SUPABASE_URL || file.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SECRET_KEY || file.SUPABASE_SECRET_KEY;
const out = process.argv[2];
if (!URL_ || !KEY || !out) {
  console.error("✗ Uso: SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/backup-storage.mjs <pasta>");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${KEY}`, apikey: KEY };
async function api(path, init = {}) {
  const res = await fetch(`${URL_}/storage/v1${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

// Pastas no Storage são prefixos: um item sem id é uma pasta e lista-se recursivamente.
async function listAll(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await (
      await api(`/object/list/${bucket}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
      })
    ).json();
    for (const item of page) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listAll(bucket, path)));
      else files.push(path);
    }
    if (page.length < 1000) return files;
  }
}

const buckets = await (await api("/bucket")).json();
let total = 0;
let bytes = 0;
for (const bucket of buckets) {
  const paths = await listAll(bucket.id);
  for (const path of paths) {
    const data = Buffer.from(await (await api(`/object/${bucket.id}/${path.split("/").map(encodeURIComponent).join("/")}`)).arrayBuffer());
    const dest = join(out, bucket.id, ...path.split("/"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, data);
    total += 1;
    bytes += data.length;
  }
  console.log(`✓ ${bucket.id}: ${paths.length} ficheiro(s)`);
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "buckets.json"), JSON.stringify(buckets, null, 2));
console.log(`✓ Storage: ${total} ficheiro(s), ${(bytes / 1024 / 1024).toFixed(1)} MB em ${buckets.length} bucket(s)`);
