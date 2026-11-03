import CategoryPage, { type CategorySearchParams } from "@/components/CategoryPage";

export const metadata = { title: "Lareiras — Lareiras Pachinha" };

export default function LareirasPage({ searchParams }: { searchParams: CategorySearchParams }) {
  return (
    <CategoryPage
      slug="lareiras"
      title="Lareiras para todos os espaços."
      subtitle="A lenha, a gás, elétricas ou a bioetanol — com aconselhamento técnico e instalação incluída."
      searchParams={searchParams}
    />
  );
}
