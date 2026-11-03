import CategoryLayout from "@/components/CategoryLayout";
import type { Product } from "@/lib/catalog";

export const metadata = { title: "Outlet — Lareiras Pachinha" };

// Modelos de exposição e últimas unidades (provisórios até a Sandra indicar os reais).
const products: Product[] = [
  { category: "salamandras", brand: "MCZ", name: "Salamandra a pellets — exposição", fuel: "pellets", img: "/images/orcamento/salamandra.jpg", badge: "Exposição" },
  { category: "recuperadores", brand: "Solzaima", name: "Recuperador a lenha — última unidade", fuel: "lenha", img: "/images/orcamento/recuperador.jpg", badge: "Última unidade" },
  { category: "lareiras", brand: "Bellfires", name: "Lareira a gás — exposição", fuel: "gas", img: "/images/orcamento/lareira.jpg", badge: "Exposição" },
];

export default function OutletPage() {
  return (
    <CategoryLayout
      category="Outlet"
      title="Equipamentos a preços especiais."
      subtitle="Modelos de exposição e últimas unidades em perfeitas condições. Quantidades limitadas."
      heroImg="/images/orcamento/recuperador.jpg"
      products={products}
    />
  );
}
