import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Outlet — Lareiras Pachinha" };

const products = [
  { brand: "MCZ", name: "Salamandra a pellets — exposição", fuel: "Pellets", img: "/images/salamandra.jpg", badge: "−30%" },
  { brand: "Solzaima", name: "Recuperador a lenha — último", fuel: "Lenha", img: "/images/recuperador.jpg", badge: "Último" },
  { brand: "Bellfires", name: "Lareira a gás — exposição", fuel: "Gás", img: "/images/lareira.jpg", badge: "−20%" },
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
