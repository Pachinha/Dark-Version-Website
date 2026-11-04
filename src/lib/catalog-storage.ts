import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// Ficheiros do catálogo (fotos, logótipos, PDFs) no bucket público "catalog" (supabase/014_catalogo.sql).
// Só o servidor escreve, depois de confirmar que é a administração.
export const CATALOG_BUCKET = "catalog";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const publicPrefix = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CATALOG_BUCKET}/`;

// Grava o ficheiro em <pasta>/<aleatório>.<ext> e devolve o endereço público.
export async function uploadCatalogFile(file: File, folder: string) {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new Error(`tipo de ficheiro não aceite: ${file.type}`);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createAdminClient().storage.from(CATALOG_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return publicPrefix() + path;
}

// Apaga ficheiros que já não são usados. Ignora endereços de fora do bucket (ex.: /images/… do site).
export async function removeCatalogFiles(urls: (string | null | undefined)[]) {
  const prefix = publicPrefix();
  const paths = urls.filter((u): u is string => !!u && u.startsWith(prefix)).map((u) => u.slice(prefix.length));
  if (paths.length) await createAdminClient().storage.from(CATALOG_BUCKET).remove(paths);
}
