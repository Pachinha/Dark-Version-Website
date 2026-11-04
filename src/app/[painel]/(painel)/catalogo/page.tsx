import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toggleProduct } from "@/app/actions/catalog";
import { FUELS, type Fuel } from "@/lib/catalog";
import { panel } from "@/lib/panel";

type Row = {
  id: string;
  slug: string;
  name: string;
  fuel: Fuel;
  active: boolean;
  outlet: boolean;
  photos: string[];
  power_kw: number | null;
  catalog_brands: { name: string; active: boolean } | null;
  catalog_categories: { name: string; active: boolean } | null;
};

type Search = { q?: string; marca?: string; categoria?: string; estado?: string; apagado?: string };

export default async function CatalogProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { q, marca, categoria, estado, apagado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("catalog_products")
    .select("id, slug, name, fuel, active, outlet, photos, power_kw, catalog_brands(name, active), catalog_categories(name, active)")
    .order("sort")
    .order("name")
    .limit(500);
  if (q?.trim()) query = query.ilike("name", `%${q.trim().replace(/[%_]/g, "")}%`);
  if (marca) query = query.eq("brand_id", marca);
  if (categoria) query = query.eq("category_id", categoria);
  if (estado === "visiveis") query = query.eq("active", true);
  if (estado === "escondidos") query = query.eq("active", false);
  if (estado === "outlet") query = query.eq("outlet", true);

  const [{ data: products }, { data: brands }, { data: categories }] = await Promise.all([
    query.returns<Row[]>(),
    supabase.from("catalog_brands").select("id, name").order("name"),
    supabase.from("catalog_categories").select("id, name").order("sort"),
  ]);

  return (
    <section className="panel">
      <div className="item-head" style={{ alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Produtos <span className="muted" style={{ fontSize: 15, fontWeight: 500 }}>({products?.length ?? 0})</span></h2>
        <Link href={panel("/catalogo/produtos/novo")} className="btn btn-fire btn-sm">+ Novo produto</Link>
      </div>
      {apagado && <p className="alert alert-success">Produto apagado.</p>}

      <form className="row catalog-filters">
        <label className="field" style={{ flex: 2, minWidth: 180 }}>
          Pesquisar
          <input name="q" defaultValue={q} placeholder="Nome do modelo" />
        </label>
        <label className="field" style={{ flex: 1, minWidth: 150 }}>
          Marca
          <select name="marca" defaultValue={marca ?? ""}>
            <option value="">Todas</option>
            {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 150 }}>
          Categoria
          <select name="categoria" defaultValue={categoria ?? ""}>
            <option value="">Todas</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 140 }}>
          Estado
          <select name="estado" defaultValue={estado ?? ""}>
            <option value="">Todos</option>
            <option value="visiveis">Visíveis</option>
            <option value="escondidos">Escondidos</option>
            <option value="outlet">Outlet</option>
          </select>
        </label>
        <button className="btn btn-ink btn-sm" style={{ alignSelf: "flex-end", marginBottom: 4 }}>Filtrar</button>
      </form>

      {products?.length ? (
        <ul className="list">
          {products.map((p) => {
            const hiddenBy = !p.catalog_brands?.active ? "marca escondida" : !p.catalog_categories?.active ? "categoria escondida" : "";
            return (
              <li key={p.id} className="item catalog-row">
                <Link href={panel(`/catalogo/produtos/${p.id}`)} className="catalog-thumb">
                  {p.photos[0] ? <img src={p.photos[0]} alt="" /> : <span>sem foto</span>}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-head">
                    <Link href={panel(`/catalogo/produtos/${p.id}`)} style={{ color: "inherit", textDecoration: "none" }}>
                      <strong>{p.catalog_brands?.name} — {p.name}</strong>
                    </Link>
                    <span className="row" style={{ gap: 6 }}>
                      {p.outlet && <span className="pref pref-fora">Outlet</span>}
                      {!p.active && <span className="pref pref-urgente">Escondido</span>}
                      {p.active && hiddenBy && <span className="pref">Não aparece ({hiddenBy})</span>}
                    </span>
                  </div>
                  <div className="muted">
                    {p.catalog_categories?.name} · {FUELS[p.fuel]}
                    {p.power_kw ? ` · ${p.power_kw} kW` : ""} · {p.photos.length} foto{p.photos.length === 1 ? "" : "s"}
                  </div>
                  <div className="row" style={{ marginTop: 8, gap: 8 }}>
                    <Link href={panel(`/catalogo/produtos/${p.id}`)} className="btn btn-ghost btn-sm">Editar</Link>
                    <form action={toggleProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                      <button className="btn btn-ghost btn-sm">{p.active ? "Esconder" : "Mostrar no site"}</button>
                    </form>
                    {p.active && !hiddenBy && (
                      <a href={`/produto/${p.slug}`} target="_blank" rel="noreferrer" className="link" style={{ fontSize: 13 }}>Ver no site ↗</a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Nenhum produto {q || marca || categoria || estado ? "com estes filtros" : "ainda"}.</p>
      )}
    </section>
  );
}
