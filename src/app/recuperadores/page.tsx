import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Recuperadores — Lareiras Pachinha" };

const products = [
  { brand: "Cheminées Philippe", name: "Recuperador a lenha", fuel: "Lenha", img: "/images/recuperador.jpg", badge: "Importador" },
  { brand: "Solzaima", name: "Recuperador a lenha", fuel: "Lenha", img: "/images/recuperador.jpg" },
  { brand: "Edilkamin", name: "Recuperador a pellets", fuel: "Pellets", img: "/images/recuperador.jpg" },
  { brand: "Hoxter", name: "Recuperador de porta de subir", fuel: "Lenha", img: "/images/recuperador.jpg" },
  { brand: "Romotop", name: "Recuperador panorâmico", fuel: "Lenha", img: "/images/recuperador.jpg" },
  { brand: "Lacunza", name: "Recuperador a lenha", fuel: "Lenha", img: "/images/recuperador.jpg" },
];

export default function RecuperadoresPage() {
  return (
    <CategoryLayout
      category="Recuperadores de Calor"
      title="Recupere o calor, poupe na fatura."
      subtitle="Recuperadores a lenha com rendimentos acima de 80%. Solução ideal para casas com chaminé existente ou nova construção."
      heroImg="/images/recuperador.jpg"
      products={products}
    />
  );
}
