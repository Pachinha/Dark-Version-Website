import CategoryLayout from "./CategoryLayout";
import { fuelFilter } from "./ProductGrid";
import { PRODUCTS, categoryBySlug, isFuel, quoteHref, type CategorySlug } from "@/lib/catalog";

export type CategorySearchParams = Promise<{ combustivel?: string }>;

// Página de um tipo de equipamento (/lareiras, /recuperadores, ...) com filtro por combustível.
export default async function CategoryPage({
  slug,
  title,
  subtitle,
  searchParams,
}: {
  slug: CategorySlug;
  title: string;
  subtitle: string;
  searchParams: CategorySearchParams;
}) {
  const { combustivel } = await searchParams;
  const category = categoryBySlug(slug)!;
  const all = PRODUCTS.filter((p) => p.category === slug);
  const fuel = isFuel(combustivel) && all.some((p) => p.fuel === combustivel) ? combustivel : undefined;

  return (
    <CategoryLayout
      category={category.label}
      title={title}
      subtitle={subtitle}
      heroImg={category.img}
      products={fuel ? all.filter((p) => p.fuel === fuel) : all}
      filters={[fuelFilter(all, category.href, fuel)]}
      quoteHref={quoteHref(slug, fuel)}
    />
  );
}
