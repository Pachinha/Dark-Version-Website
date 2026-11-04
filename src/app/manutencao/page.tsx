import { permanentRedirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";

// A página de manutenção passou a fazer parte do Apoio ao cliente.
export default async function ManutencaoPage() {
  const { href } = await getI18n();
  permanentRedirect(href("/apoio-ao-cliente"));
}
