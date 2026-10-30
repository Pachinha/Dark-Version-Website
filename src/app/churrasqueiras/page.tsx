import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Churrasqueiras — Lareiras Pachinha" };

const products = [
  { brand: "Fogo Montanha", name: "Churrasqueira de alvenaria", fuel: "Lenha / carvão", img: "/images/churrasqueira.jpg" },
  { brand: "Bronpi", name: "Churrasqueira pré-fabricada", fuel: "Lenha / carvão", img: "/images/churrasqueira.jpg" },
  { brand: "Cozingas", name: "Grelhador a gás", fuel: "Gás", img: "/images/churrasqueira.jpg" },
];

export default function ChurrasqueirasPage() {
  return (
    <CategoryLayout
      category="Churrasqueiras"
      title="O exterior merece o melhor."
      subtitle="Churrasqueiras a carvão, a lenha e a gás. Para momentos em família com a qualidade que a Pachinha garante há mais de 30 anos."
      heroImg="/images/churrasqueira.jpg"
      products={products}
    />
  );
}
