import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Recuperadores — Lareiras Pachinha" };

const products = [
  {
    name: "Barbas — Vitro 90",
    desc: "Rendimento superior a 80%, potência 14 kW. Vidro panorâmico e câmara dupla combustão. Ideal para 80–120 m².",
    img: "/images/recuperador.jpg",
    badge: "Mais vendido",
  },
  {
    name: "Edilkamin — Clou 80",
    desc: "Design italiano contemporâneo, ventilação forçada integrada. Eficiência certificada A+.",
    img: "/images/recuperador.jpg",
  },
  {
    name: "La Nordica — Extraflame",
    desc: "Recuperador de grandes dimensões, até 18 kW. Indicado para casas com mais de 150 m².",
    img: "/images/recuperador.jpg",
  },
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
