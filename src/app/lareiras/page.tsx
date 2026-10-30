import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Lareiras — Lareiras Pachinha" };

const products = [
  { brand: "Bellfires", name: "Lareira a gás", fuel: "Gás", img: "/images/lareira.jpg", badge: "Mais vendido" },
  { brand: "Stûv", name: "Lareira dupla face", fuel: "Lenha", img: "/images/lareira.jpg" },
  { brand: "Cheminées Philippe", name: "Lareira metálica", fuel: "Lenha", img: "/images/lareira.jpg" },
  { brand: "Focus", name: "Lareira suspensa", fuel: "Lenha", img: "/images/lareira.jpg" },
  { brand: "DRU", name: "Lareira elétrica", fuel: "Elétrica", img: "/images/lareira.jpg" },
  { brand: "M Design", name: "Lareira a bioetanol", fuel: "Bioetanol", img: "/images/lareira.jpg" },
];

export default function LareirasPage() {
  return (
    <CategoryLayout
      category="Lareiras"
      title="Lareiras para todos os espaços."
      subtitle="A lenha, a gás ou bioetanol — encontre a lareira perfeita para a sua sala. Marcas europeias com décadas de experiência."
      heroImg="/images/lareira.jpg"
      products={products}
    />
  );
}
