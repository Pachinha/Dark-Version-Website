import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Salamandras — Lareiras Pachinha" };

const products = [
  {
    name: "Ravelli — R 80 V",
    desc: "Termostato digital, ventoinhas silenciosas. Aquece até 120 m². Controlo por WiFi disponível.",
    img: "/images/salamandra.jpg",
    badge: "WiFi",
  },
  {
    name: "MCZ — Club Air 14 UP!",
    desc: "Salamandra a pellets com distribuição de ar a quente. Programação semanal e controlo por app.",
    img: "/images/salamandra.jpg",
  },
  {
    name: "La Nordica — Isetta",
    desc: "Salamandra a lenha compacta, ideal para pequenos espaços. Design retro italiano. 7 kW.",
    img: "/images/salamandra.jpg",
  },
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
