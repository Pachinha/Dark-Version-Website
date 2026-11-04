import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory } from "@/app/actions/catalog";
import CategoryForm, { type CategoryFormData } from "@/components/admin/catalog/CategoryForm";
import { DeleteForm } from "@/components/admin/catalog/shared";
import { CATEGORY_COLUMNS } from "@/lib/catalog-data";
import { panel } from "@/lib/panel";

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> }) {
  const { id } = await params;
  const { criado } = await searchParams;
  const supabase = await createClient();
  const [{ data: category }, { count }] = await Promise.all([
    supabase.from("catalog_categories").select(CATEGORY_COLUMNS).eq("id", id).maybeSingle<CategoryFormData>(),
    supabase.from("catalog_products").select("id", { count: "exact", head: true }).eq("category_id", id),
  ]);
  if (!category) notFound();

  return (
    <>
      <section className="panel">
        <Link href={panel("/catalogo/categorias")} className="link">← Categorias</Link>
        <div className="item-head" style={{ alignItems: "center" }}>
          <h2>{category.name}</h2>
          <Link href={panel(`/catalogo?categoria=${category.id}`)} className="link">Ver os {count ?? 0} produtos →</Link>
        </div>
        {criado && <p className="alert alert-success">Categoria criada. Pode continuar a editar.</p>}
        <CategoryForm category={category} />
      </section>
      <section className="panel">
        <h2>Apagar</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Só é possível apagar uma categoria sem produtos. Para a tirar do site sem perder nada, desmarque &quot;Visível no site&quot;.
        </p>
        <DeleteForm action={deleteCategory} id={category.id} what="esta categoria" />
      </section>
    </>
  );
}
