import { permanentRedirect } from "next/navigation";

// A página de manutenção passou a fazer parte do Apoio ao cliente.
export default function ManutencaoPage() {
  permanentRedirect("/apoio-ao-cliente");
}
