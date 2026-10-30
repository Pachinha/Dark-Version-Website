import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Fogões — Lareiras Pachinha" };

const products = [
  { brand: "Godin", name: "Fogão de cozinha a lenha", fuel: "Lenha", img: "/images/fogao.jpg", badge: "Importador" },
  { brand: "La Nordica", name: "Fogão de cozinha a lenha", fuel: "Lenha", img: "/images/fogao.jpg" },
  { brand: "Bronpi", name: "Fogão de cozinha a lenha", fuel: "Lenha", img: "/images/fogao.jpg" },
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
