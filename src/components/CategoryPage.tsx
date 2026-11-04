import { notFound } from "next/navigation";
import CategoryLayout from "./CategoryLayout";
import { fuelFilter } from "./ProductGrid";
import { isFuel, quoteHref } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { getI18n } from "@/lib/i18n/server";

// Página de um tipo de equipamento (/produtos/lareiras, …) com filtro por combustível.
// Nome, frase e imagem da categoria vêm do painel (Catálogo → Categorias).
export default async function CategoryPage({ slug, combustivel }: { slug: string; combustivel?: string }) {
  const { locale, t, href } = await getI18n();
  const { categories, products } = await getCatalog(locale);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const all = products.filter((p) => p.category.slug === slug && !p.outlet);
  const fuel = isFuel(combustivel) && all.some((p) => p.fuel === combustivel) ? combustivel : undefined;

  return (
    <CategoryLayout
      category={category.name}
      title={category.title || category.name}
      subtitle={category.subtitle}
      heroImg={category.image || "/images/hero.png"}
      products={fuel ? all.filter((p) => p.fuel === fuel) : all}
      filters={[fuelFilter(t, href, all, category.href, fuel)]}
      quoteHref={quoteHref(slug, fuel)}
    />
  );
}
