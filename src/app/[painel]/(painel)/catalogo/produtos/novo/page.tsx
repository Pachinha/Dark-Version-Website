import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/catalog/ProductForm";
import { panel } from "@/lib/panel";

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("catalog_brands").select("id, name, active").order("name"),
    supabase.from("catalog_categories").select("id, name, active").order("sort"),
  ]);

  return (
    <section className="panel">
      <Link href={panel("/catalogo")} className="link">← Produtos</Link>
      <h2>Novo produto</h2>
      <ProductForm brands={brands ?? []} categories={categories ?? []} />
    </section>
  );
}
