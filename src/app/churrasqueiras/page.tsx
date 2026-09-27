import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Churrasqueiras — Lareiras Pachinha" };

const products = [
  {
    name: "Camin — Brasa Inox 90",
    desc: "Churrasqueira a carvão em inox 304. Grelha regulável em altura. Design português, feita para durar.",
    img: "/images/churrasqueira.jpg",
    badge: "Nacional",
  },
  {
    name: "Camin — Stone Garden",
    desc: "Churrasqueira em pedra natural com estrutura de aço. Integração perfeita em terraço ou jardim.",
    img: "/images/churrasqueira.jpg",
  },
  {
    name: "Barbas — Outdoor Maxi",
    desc: "Churrasqueira a lenha com forno de pedra incorporado. Para quem quer o máximo no exterior.",
    img: "/images/churrasqueira.jpg",
  },
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
