import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Fogões — Lareiras Pachinha" };

const products = [
  {
    name: "La Nordica — Suprema",
    desc: "Fogão a lenha com forno integrado. 12 kW de potência. Aquece e cozinha ao mesmo tempo.",
    img: "/images/fogao.jpg",
    badge: "Com forno",
  },
  {
    name: "Edilkamin — Cucina 80",
    desc: "Fogão de cozinha a pellets com placa de indução. Autonomia de 24h com depósito cheio.",
    img: "/images/fogao.jpg",
  },
  {
    name: "MCZ — Philo Air",
    desc: "Fogão a pellets com design moderno. Controlo por app, ventilação natural silenciosa.",
    img: "/images/fogao.jpg",
  },
];

export default function FogoesPage() {
  return (
    <CategoryLayout
      category="Fogões"
      title="Fogões que aquecem e cozinham."
      subtitle="Tradição e modernidade numa só peça. Os nossos fogões a lenha e a pellets são ideais para quem quer eficiência sem abdicar do charme."
      heroImg="/images/fogao.jpg"
      products={products}
    />
  );
}
