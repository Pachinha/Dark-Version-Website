import CategoryPage, { type CategorySearchParams } from "@/components/CategoryPage";

export const metadata = { title: "Recuperadores de calor — Lareiras Pachinha" };

export default function RecuperadoresPage({ searchParams }: { searchParams: CategorySearchParams }) {
  return (
    <CategoryPage
      slug="recuperadores"
      title="Recupere o calor, poupe na fatura."
      subtitle="A lenha ou a pellets, para a lareira que já tem ou para uma construção nova."
      searchParams={searchParams}
    />
  );
}
