import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Outlet — Lareiras Pachinha" };

const products = [
  {
    name: "Ravelli R 60 — Exposição",
    desc: "Salamandra a pellets do nosso showroom. Em perfeito estado. Stock único, preço reduzido.",
    img: "/images/salamandra.jpg",
    badge: "−30%",
  },
  {
    name: "Barbas Vitro 70 — Último",
    desc: "Recuperador de calor último do stock. Rendimento 78%, 11 kW. Inclui kit de instalação.",
    img: "/images/recuperador.jpg",
    badge: "Último",
  },
  {
    name: "Bellfires Room — Exposição",
    desc: "Lareira a gás de chão, modelo de exposição. Ligeiras marcas de uso, funcionamento impecável.",
    img: "/images/lareira.jpg",
    badge: "−20%",
  },
];

export default function OutletPage() {
  return (
    <CategoryLayout
      category="Outlet"
      title="Equipamentos a preços especiais."
      subtitle="Modelos de exposição, últimas unidades e devoluções em perfeitas condições. Oportunidades limitadas — aconselhe-se connosco."
      heroImg="/images/prod1.jpg"
      products={products}
    />
  );
}
