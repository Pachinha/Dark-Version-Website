import CategoryPage, { type CategorySearchParams } from "@/components/CategoryPage";

export const metadata = { title: "Churrasqueiras — Lareiras Pachinha" };

export default function ChurrasqueirasPage({ searchParams }: { searchParams: CategorySearchParams }) {
  return (
    <CategoryPage
      slug="churrasqueiras"
      title="O exterior merece o melhor."
      subtitle="Churrasqueiras a carvão e grelhadores a gás, para os dias em família."
      searchParams={searchParams}
    />
  );
}
