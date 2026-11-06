import CategoryLayout from "@/components/CategoryLayout";
import { getCatalog } from "@/lib/catalog-data";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.nav.outlet);

// Modelos de exposição e últimas unidades: produtos marcados "Outlet" no painel.
export default async function OutletPage() {
  const { locale, t } = await getI18n();
  const products = (await getCatalog(locale)).products.filter((p) => p.outlet);
  return (
    <CategoryLayout
      section="outlet"
      category={t.nav.outlet}
      title={t.category.outletTitle}
      subtitle={t.category.outletSubtitle}
      heroImg="/images/orcamento/recuperador.jpg"
      products={products}
    />
  );
}
