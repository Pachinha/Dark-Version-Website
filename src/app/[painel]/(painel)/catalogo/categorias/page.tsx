import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { panel } from "@/lib/panel";

type Row = { id: string; name: string; slug: string; image_url: string; active: boolean; catalog_products: { count: number }[] };

export default async function CatalogCategoriesPage({ searchParams }: { searchParams: Promise<{ apagado?: string }> }) {
  const { apagado } = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("catalog_categories")
    .select("id, name, slug, image_url, active, catalog_products(count)")
    .order("sort")
    .order("name")
    .returns<Row[]>();

  return (
    <section className="panel">
      <div className="item-head" style={{ alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Categorias</h2>
        <Link href={panel("/catalogo/categorias/nova")} className="btn btn-fire btn-sm">+ Nova categoria</Link>
      </div>
      {apagado && <p className="alert alert-success">Categoria apagada.</p>}
      <p className="muted">A ordem aqui é a ordem do menu &quot;Produtos&quot; e dos cartões da página inicial.</p>
      <ul className="list">
        {categories?.map((c) => (
          <li key={c.id}>
            <Link href={panel(`/catalogo/categorias/${c.id}`)} className="item catalog-row" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="catalog-thumb">{c.image_url ? <img src={c.image_url} alt="" /> : <span>sem imagem</span>}</span>
              <div style={{ flex: 1 }}>
                <div className="item-head">
                  <strong>{c.name}</strong>
                  {!c.active && <span className="pref pref-urgente">Escondida</span>}
                </div>
                <div className="muted">/produtos/{c.slug} · {c.catalog_products[0]?.count ?? 0} produto{c.catalog_products[0]?.count === 1 ? "" : "s"}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
