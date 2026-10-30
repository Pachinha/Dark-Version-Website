import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// Bucket privado criado em supabase/005_pedido_orcamento.sql
export const PHOTO_BUCKET = "quote-photos";

// Links temporários (1 hora) para a equipa ver as fotos de um pedido.
export async function signedPhotoUrls(paths: string[] | null | undefined) {
  if (!paths?.length) return [];
  const { data } = await createAdminClient().storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
  return (data ?? []).flatMap((d) => (d.signedUrl ? [d.signedUrl] : []));
}
