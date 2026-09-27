import CategoryLayout from "@/components/CategoryLayout";

export const metadata = { title: "Lareiras — Lareiras Pachinha" };

const products = [
  {
    name: "Bellfires — Bay Angular",
    desc: "Chama realista a gás natural ou GPL. Design minimalista holandês. Encaixe em ângulo para canto de sala.",
    img: "/images/lareira.jpg",
    badge: "Mais vendido",
  },
  {
    name: "Stuv 21 — Dupla Face",
    desc: "Lareira a lenha de dupla face, visível dos dois lados da divisão. Vidro resistente a 800ºC.",
    img: "/images/lareira.jpg",
  },
  {
    name: "DRU — Cosmo 100 RCH",
    desc: "Lareira a gás embutida de alta eficiência. Controlo remoto incluído. Acende em segundos.",
    img: "/images/lareira.jpg",
  },
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
