import CategoryPage, { type CategorySearchParams } from "@/components/CategoryPage";

export const metadata = { title: "Fogões — Lareiras Pachinha" };

export default function FogoesPage({ searchParams }: { searchParams: CategorySearchParams }) {
  return (
    <CategoryPage
      slug="fogoes"
      title="Fogões que aquecem e cozinham."
      subtitle="Fogões de cozinha a lenha, entre a tradição e o design atual."
      searchParams={searchParams}
    />
  );
}
