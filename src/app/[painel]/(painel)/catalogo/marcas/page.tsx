import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { panel } from "@/lib/panel";

type Row = { id: string; name: string; logo_url: string; logo_height: number; active: boolean; in_ticker: boolean; imported: boolean; catalog_products: { count: number }[] };

export default async function CatalogBrandsPage({ searchParams }: { searchParams: Promise<{ apagado?: string }> }) {
  const { apagado } = await searchParams;
  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("catalog_brands")
    .select("id, name, logo_url, logo_height, active, in_ticker, imported, catalog_products(count)")
    .order("sort")
    .order("name")
    .returns<Row[]>();

  return (
    <section className="panel">
      <div className="item-head" style={{ alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Marcas <span className="muted" style={{ fontSize: 15, fontWeight: 500 }}>({brands?.length ?? 0})</span></h2>
        <Link href={panel("/catalogo/marcas/nova")} className="btn btn-fire btn-sm">+ Nova marca</Link>
      </div>
      {apagado && <p className="alert alert-success">Marca apagada.</p>}
      <p className="muted">A ordem aqui é a ordem da faixa de marcas da página inicial (muda-se em &quot;Avançado&quot; dentro de cada marca).</p>
      <ul className="card-list">
        {brands?.map((b) => (
          <li key={b.id}>
            <Link href={panel(`/catalogo/marcas/${b.id}`)} className="item catalog-row" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="logo-chip">
                {b.logo_url ? <img src={b.logo_url} alt="" style={{ height: Math.min(b.logo_height, 34) }} /> : <span className="ticker-name" style={{ fontSize: 12 }}>{b.name}</span>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-head">
                  <strong>{b.name}</strong>
                  <span className="row" style={{ gap: 6 }}>
                    {b.imported && <span className="pref pref-fora">Importador</span>}
                    {!b.in_ticker && <span className="pref">Fora da faixa</span>}
                    {!b.active && <span className="pref pref-urgente">Escondida</span>}
                  </span>
                </div>
                <div className="muted">
                  {b.catalog_products[0]?.count ?? 0} produto{b.catalog_products[0]?.count === 1 ? "" : "s"}
                  {b.logo_url ? "" : " · sem logótipo"}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
