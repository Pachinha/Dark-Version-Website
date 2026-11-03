import CategoryLayout from "@/components/CategoryLayout";
import { fuelFilter } from "@/components/ProductGrid";
import { CATEGORIES, FUELS, PRODUCTS, categoryBySlug, isFuel, quoteHref } from "@/lib/catalog";

export const metadata = { title: "Produtos — Lareiras Pachinha" };

// Catálogo completo, filtrável por tipo e por combustível (ex.: /produtos?combustivel=pellets).
export default async function ProdutosPage({ searchParams }: { searchParams: Promise<{ tipo?: string; combustivel?: string }> }) {
  const { tipo, combustivel } = await searchParams;
  const category = tipo ? categoryBySlug(tipo) : undefined;
  const fuel = isFuel(combustivel) ? combustivel : undefined;

  const byFuel = fuel ? PRODUCTS.filter((p) => p.fuel === fuel) : PRODUCTS;
  const byType = category ? PRODUCTS.filter((p) => p.category === category.slug) : PRODUCTS;
  const products = category ? byFuel.filter((p) => p.category === category.slug) : byFuel;

  const typeHref = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("tipo", slug);
    if (fuel) params.set("combustivel", fuel);
    const qs = params.toString();
    return `/produtos${qs ? `?${qs}` : ""}`;
  };

  return (
    <CategoryLayout
      category="Produtos"
      title={fuel ? `Equipamentos a ${FUELS[fuel].toLowerCase()}` : "Todos os produtos"}
      subtitle="Lareiras, recuperadores e salamandras a lenha, pellets, gás, elétricas e bioetanol — com aconselhamento técnico e instalação incluída."
      heroImg="/images/hero.png"
      products={products}
      filters={[
        {
          label: "Tipo",
          options: [
            { label: "Todos", href: typeHref(), active: !category },
            ...CATEGORIES.filter((c) => byFuel.some((p) => p.category === c.slug)).map((c) => ({
              label: c.label,
              href: typeHref(c.slug),
              active: category?.slug === c.slug,
            })),
          ],
        },
        fuelFilter(byType, "/produtos", fuel, category ? { tipo: category.slug } : {}),
      ]}
      quoteHref={quoteHref(category?.slug, fuel)}
    />
  );
}
