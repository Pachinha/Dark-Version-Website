import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { alertAdmins } from "@/lib/staff-alert";
import { panel } from "@/lib/panel";

// Espaço ocupado no Supabase (supabase/018_espaco.sql), para nunca ultrapassar o plano gratuito.
// Limites do plano gratuito; se um dia mudarem, ajusta-se em .env (em MB), sem mexer no código.
const MB = 1024 * 1024;
const LIMITS = {
  database: Number(process.env.SPACE_DATABASE_LIMIT_MB || 500) * MB,
  storage: Number(process.env.SPACE_STORAGE_LIMIT_MB || 1024) * MB,
};
// Avisos à administração quando o espaço passa destes valores (uma vez por nível).
const LEVELS = [80, 90, 95];

export type SpaceKind = keyof typeof LIMITS;
export type Space = Record<SpaceKind, { bytes: number; limit: number; pct: number }> & {
  buckets: { bucket: string; bytes: number; files: number }[];
};

const LABEL: Record<SpaceKind, string> = { database: "dados (pedidos, clientes, catálogo)", storage: "fotografias e imagens" };
export const BUCKET_LABEL: Record<string, string> = { "quote-photos": "Fotos dos pedidos", catalog: "Imagens do catálogo" };

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * MB) return `${Number((bytes / (1024 * MB)).toFixed(2)).toString().replace(".", ",")} GB`;
  if (bytes >= MB) return `${Math.round(bytes / MB)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// null se a migração 018 ainda não foi aplicada (o painel simplesmente não mostra o espaço).
export async function getSpace(): Promise<Space | null> {
  const { data, error } = await createAdminClient().rpc("space_usage");
  if (error || !data) return null;
  const rows = data as { kind: SpaceKind; bucket: string | null; bytes: number; files: number | null }[];
  const total = (kind: SpaceKind) => rows.filter((r) => r.kind === kind).reduce((s, r) => s + Number(r.bytes), 0);
  const entry = (kind: SpaceKind) => {
    const bytes = total(kind);
    return { bytes, limit: LIMITS[kind], pct: Math.round((bytes / LIMITS[kind]) * 100) };
  };
  return {
    database: entry("database"),
    storage: entry("storage"),
    buckets: rows
      .filter((r) => r.kind === "storage" && r.bucket)
      .map((r) => ({ bucket: r.bucket!, bytes: Number(r.bytes), files: Number(r.files ?? 0) }))
      .sort((a, b) => b.bytes - a.bytes),
  };
}

// Chamado depois de guardar pedidos e fotografias: avisa a administração (Telegram + email)
// quando o espaço passa 80, 90 ou 95% — uma vez por nível. Se o espaço voltar a descer
// (fotos arquivadas ou apagadas), o nível baixa e volta a avisar se subir outra vez.
export async function checkSpace() {
  try {
    const space = await getSpace();
    if (!space) return;
    const admin = createAdminClient();
    const { data: sent } = await admin.from("space_alerts").select("kind, level").returns<{ kind: SpaceKind; level: number }[]>();
    for (const kind of ["database", "storage"] as const) {
      const { bytes, limit, pct } = space[kind];
      const level = [...LEVELS].reverse().find((l) => pct >= l) ?? 0;
      const previous = sent?.find((s) => s.kind === kind)?.level ?? 0;
      if (level === previous) continue;
      await admin.from("space_alerts").upsert({ kind, level, updated_at: new Date().toISOString() });
      if (level > previous) {
        await alertAdmins(
          [
            `⚠️ Espaço do site: ${LABEL[kind]} a ${pct}%`,
            `${formatBytes(bytes)} de ${formatBytes(limit)} do plano gratuito.`,
            kind === "storage"
              ? "Está na hora de arquivar as fotos de pedidos antigos (ver README, \"Espaço\")."
              : "Ver o README (\"Espaço\") antes de chegar aos 100%.",
            "",
            `Ver no painel: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${panel()}`,
          ].join("\n"),
        );
      }
    }
  } catch (error) {
    console.error("[espaço]", error);
  }
}
