import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteBrand } from "@/app/actions/catalog";
import BrandForm, { type BrandFormData } from "@/components/admin/catalog/BrandForm";
import { DeleteForm } from "@/components/admin/catalog/shared";
import { BRAND_COLUMNS } from "@/lib/catalog-data";
import { panel } from "@/lib/panel";

export default async function EditBrandPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> }) {
  const { id } = await params;
  const { criado } = await searchParams;
  const supabase = await createClient();
  const [{ data: brand }, { count }] = await Promise.all([
    supabase.from("catalog_brands").select(BRAND_COLUMNS).eq("id", id).maybeSingle<BrandFormData>(),
    supabase.from("catalog_products").select("id", { count: "exact", head: true }).eq("brand_id", id),
  ]);
  if (!brand) notFound();

  return (
    <>
      <section className="panel">
        <Link href={panel("/catalogo/marcas")} className="link">← Marcas</Link>
        <div className="item-head" style={{ alignItems: "center" }}>
          <h2>{brand.name}</h2>
          <Link href={panel(`/catalogo?marca=${brand.id}`)} className="link">Ver os {count ?? 0} produtos desta marca →</Link>
        </div>
        {criado && <p className="alert alert-success">Marca criada. Pode continuar a editar.</p>}
        <BrandForm brand={brand} />
      </section>
      <section className="panel">
        <h2>Apagar</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Só é possível apagar uma marca sem produtos. Para a tirar do site sem perder nada, desmarque &quot;Visível no site&quot;.
        </p>
        <DeleteForm action={deleteBrand} id={brand.id} what="esta marca" />
      </section>
    </>
  );
}
