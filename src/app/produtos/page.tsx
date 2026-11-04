import CategoryLayout from "@/components/CategoryLayout";
import { fuelFilter } from "@/components/ProductGrid";
import { isFuel, quoteHref } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { fmt, midSentence } from "@/lib/i18n/config";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.nav.products);

// Catálogo completo, filtrável por tipo e por combustível (ex.: /produtos?combustivel=pellets).
// O outlet tem página própria.
export default async function ProdutosPage({ searchParams }: { searchParams: Promise<{ tipo?: string; combustivel?: string }> }) {
  const { locale, t, href } = await getI18n();
  const { categories, products: all } = await getCatalog(locale);
  const { tipo, combustivel } = await searchParams;
  const catalog = all.filter((p) => !p.outlet);
  const category = tipo ? categories.find((c) => c.slug === tipo) : undefined;
  const fuel = isFuel(combustivel) ? combustivel : undefined;

  const byFuel = fuel ? catalog.filter((p) => p.fuel === fuel) : catalog;
  const byType = category ? catalog.filter((p) => p.category.slug === category.slug) : catalog;
  const products = category ? byFuel.filter((p) => p.category.slug === category.slug) : byFuel;

  const typeHref = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("tipo", slug);
    if (fuel) params.set("combustivel", fuel);
    const qs = params.toString();
    return href(`/produtos${qs ? `?${qs}` : ""}`);
  };

  return (
    <CategoryLayout
      category={t.category.productsEyebrow}
      title={fuel ? fmt(t.category.byFuelTitle, { fuel: midSentence(locale, t.catalog.fuels[fuel]) }) : t.category.allProducts}
      subtitle={t.category.productsSubtitle}
      heroImg="/images/hero.png"
      products={products}
      filters={[
        {
          label: t.category.type,
          options: [
            { label: t.common.all, href: typeHref(), active: !category },
            ...categories
              .filter((c) => byFuel.some((p) => p.category.slug === c.slug))
              .map((c) => ({ label: c.name, href: typeHref(c.slug), active: category?.slug === c.slug })),
          ],
        },
        fuelFilter(t, href, byType, "/produtos", fuel, category ? { tipo: category.slug } : {}),
      ]}
      quoteHref={quoteHref(category?.slug, fuel)}
    />
  );
}
