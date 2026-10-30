import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Salamandras — Lareiras Pachinha" };

const products = [
  { brand: "Godin", name: "Salamandra em ferro fundido", fuel: "Lenha", img: "/images/salamandra.jpg", badge: "Importador" },
  { brand: "MCZ", name: "Salamandra a pellets", fuel: "Pellets", img: "/images/salamandra.jpg" },
  { brand: "Jøtul", name: "Salamandra a lenha", fuel: "Lenha", img: "/images/salamandra.jpg" },
  { brand: "Ecoforest", name: "Salamandra a pellets", fuel: "Pellets", img: "/images/salamandra.jpg" },
  { brand: "Bronpi", name: "Salamandra a lenha", fuel: "Lenha", img: "/images/salamandra.jpg" },
  { brand: "Evacalor", name: "Salamandra a pellets", fuel: "Pellets", img: "/images/salamandra.jpg" },
];

export default function SalamandrásPage() {
  return (
    <CategoryLayout
      category="Salamandras"
      title="Calor inteligente com salamandras."
      subtitle="A lenha, a pellets ou a gás — as nossas salamandras combinam eficiência energética com design atemporal."
      heroImg="/images/salamandra.jpg"
      products={products}
    />
  );
}
