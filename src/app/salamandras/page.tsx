import CategoryPage, { type CategorySearchParams } from "@/components/CategoryPage";

export const metadata = { title: "Salamandras — Lareiras Pachinha" };

export default function SalamandrasPage({ searchParams }: { searchParams: CategorySearchParams }) {
  return (
    <CategoryPage
      slug="salamandras"
      title="Calor onde precisa."
      subtitle="Salamandras a lenha e a pellets, independentes e fáceis de instalar."
      searchParams={searchParams}
    />
  );
}
