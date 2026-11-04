import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "@/app/actions/catalog";
import ProductForm, { type ProductFormData } from "@/components/admin/catalog/ProductForm";
import { DeleteForm } from "@/components/admin/catalog/shared";
import { PRODUCT_COLUMNS } from "@/lib/catalog-data";
import { panel } from "@/lib/panel";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> }) {
  const { id } = await params;
  const { criado } = await searchParams;
  const supabase = await createClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("catalog_brands").select("id, name, active").order("name"),
    supabase.from("catalog_categories").select("id, name, active").order("sort"),
  ]);
  const { data: product } = await supabase.from("catalog_products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle<ProductFormData>();
  if (!product) notFound();

  return (
    <>
      <section className="panel">
        <Link href={panel("/catalogo")} className="link">← Produtos</Link>
        <div className="item-head" style={{ alignItems: "center" }}>
          <h2>{product.name}</h2>
          {product.active && <a href={`/produto/${product.slug}`} target="_blank" rel="noreferrer" className="link">Ver no site ↗</a>}
        </div>
        {criado && <p className="alert alert-success">Produto criado. Pode continuar a editar.</p>}
        <ProductForm product={product} brands={brands ?? []} categories={categories ?? []} />
      </section>
      <section className="panel">
        <h2>Apagar</h2>
        <p className="muted" style={{ marginTop: 0 }}>Apaga o produto e as fotos dele. Para o tirar do site temporariamente, basta desmarcar &quot;Visível no site&quot;.</p>
        <DeleteForm action={deleteProduct} id={product.id} what="este produto" />
      </section>
    </>
  );
}
