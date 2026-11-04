import Link from "next/link";
import AnimateIn from "./AnimateIn";
import { FUEL_KEYS, quoteHref, type Fuel } from "@/lib/catalog";
import type { Product } from "@/lib/catalog-data";
import { fmt, formatNumber, midSentence } from "@/lib/i18n/config";
import type { Dict } from "@/lib/i18n/dict/types";
import { getI18n } from "@/lib/i18n/server";

export type FilterRow = {
  label: string;
  options: { label: string; href: string; active: boolean }[];
};

const chip = (selected: boolean) => ({
  fontSize: "13px",
  fontWeight: 600,
  padding: "8px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
  border: `1px solid ${selected ? "#f2ece2" : "rgba(242,236,226,0.2)"}`,
  background: selected ? "#f2ece2" : "transparent",
  color: selected ? "#262019" : "rgba(242,236,226,0.8)",
});

// Botões de filtro (ex.: Todos · Lenha · Pellets). Só aparecem quando há mais do que uma opção.
export async function Filters({ rows }: { rows: FilterRow[] }) {
  const { locale, t } = await getI18n();
  const visible = rows.filter((row) => row.options.length > 2);
  if (!visible.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
      {visible.map((row) => (
        <nav key={row.label} aria-label={fmt(t.category.filterBy, { what: midSentence(locale, row.label) })} className="chip-row">
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)", minWidth: "110px" }}>
            {row.label}
          </span>
          {row.options.map((o) => (
            <Link key={o.label} href={o.href} scroll={false} style={chip(o.active)} aria-current={o.active ? "page" : undefined}>
              {o.label}
            </Link>
          ))}
        </nav>
      ))}
    </div>
  );
}

// Filtro por combustível para uma lista de produtos, só com os combustíveis que existem nessa lista.
// `link` mantém a língua da página nos links dos filtros.
export function fuelFilter(t: Dict, link: (path: string) => string, products: Product[], basePath: string, active?: Fuel, extra: Record<string, string> = {}): FilterRow {
  const href = (fuel?: Fuel) => {
    const params = new URLSearchParams(extra);
    if (fuel) params.set("combustivel", fuel);
    const qs = params.toString();
    return link(`${basePath}${qs ? `?${qs}` : ""}`);
  };
  const fuels = FUEL_KEYS.filter((f) => products.some((p) => p.fuel === f));
  return {
    label: t.category.fuel,
    options: [{ label: t.common.all, href: href(), active: !active }, ...fuels.map((f) => ({ label: t.catalog.fuels[f], href: href(f), active: active === f }))],
  };
}

// Etiqueta do cartão: "Importador" vem da marca; as outras escolhe-as a administração no produto.
export function badgeOf(product: Product, t: Dict) {
  if (product.badge) return t.catalog.badges[product.badge] ?? "";
  return product.brand.imported ? t.catalog.badges.importador : "";
}

export default async function ProductGrid({ products }: { products: Product[] }) {
  const { locale, t, href } = await getI18n();

  if (!products.length) {
    return (
      <p style={{ fontSize: "15px", color: "rgba(242,236,226,0.6)", margin: "0 0 24px" }}>
        {t.category.empty}{" "}
        <Link href={href("/pedir-orcamento")} style={{ color: "#e2a276" }}>{t.category.askAdvice}</Link> {t.category.emptyMore}
      </p>
    );
  }

  return (
    <div className="grid-cards">
      {products.map((product, i) => {
        const badge = badgeOf(product, t);
        return (
          <AnimateIn key={product.slug} delay={(i % 3) * 80}>
            <div className="card-hover" style={{ background: "#2a1a0c", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              <Link href={href(product.href)} className="product-img-zoom" style={{ position: "relative", aspectRatio: "4 / 3", background: "#3d2a18", overflow: "hidden", display: "block" }}>
                {product.photos[0] ? (
                  <img src={product.photos[0]} alt={`${product.brand.name} — ${product.name}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                ) : (
                  <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: "13px", color: "rgba(242,236,226,0.35)" }}>{t.product.noPhoto}</span>
                )}
                {badge && (
                  <span style={{ position: "absolute", top: "12px", left: "12px", background: "#bf5b2d", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px" }}>
                    {badge}
                  </span>
                )}
              </Link>
              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#e2a276" }}>{product.brand.name}</div>
                <Link href={href(product.href)} style={{ fontSize: "17px", fontWeight: 600, color: "#f2ece2", textDecoration: "none" }}>{product.name}</Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "auto", paddingTop: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(242,236,226,0.6)", background: "rgba(242,236,226,0.07)", padding: "4px 10px", borderRadius: "999px" }}>
                    {t.catalog.fuels[product.fuel]}
                    {product.powerKw ? ` · ${formatNumber(locale, product.powerKw)} kW` : ""}
                  </span>
                  <Link href={href(quoteHref(product.category.slug, product.fuel, `${product.brand.name} ${product.name}`))} style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
                    {t.common.requestQuoteArrow}
                  </Link>
                </div>
              </div>
            </div>
          </AnimateIn>
        );
      })}
    </div>
  );
}
