import CategoryPage from "@/components/CategoryPage";
import { getCatalog } from "@/lib/catalog-data";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

type Params = { params: Promise<{ categoria: string }>; searchParams: Promise<{ combustivel?: string }> };

export async function generateMetadata({ params }: Params) {
  const { categoria } = await params;
  const { locale } = await getI18n();
  const category = (await getCatalog(locale)).categories.find((c) => c.slug === categoria);
  return pageMetadata((t) => category?.name ?? t.notFound.meta);
}

export default async function CategoriaPage({ params, searchParams }: Params) {
  const { categoria } = await params;
  const { combustivel } = await searchParams;
  return <CategoryPage slug={categoria} combustivel={combustivel} />;
}
