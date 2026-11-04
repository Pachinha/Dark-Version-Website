import { permanentRedirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";

// A página passou para /produtos/recuperadores (as categorias agora são geridas no painel).
export default async function Page({ searchParams }: { searchParams: Promise<{ combustivel?: string }> }) {
  const { href } = await getI18n();
  const { combustivel } = await searchParams;
  permanentRedirect(href(`/produtos/recuperadores${combustivel ? `?combustivel=${encodeURIComponent(combustivel)}` : ""}`));
}
