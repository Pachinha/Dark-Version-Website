import Link from "next/link";
import AnimateIn from "./AnimateIn";
import { FUELS, quoteHref, type Fuel, type Product } from "@/lib/catalog";

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
export function Filters({ rows }: { rows: FilterRow[] }) {
  const visible = rows.filter((row) => row.options.length > 2);
  if (!visible.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
      {visible.map((row) => (
        <nav key={row.label} aria-label={`Filtrar por ${row.label.toLowerCase()}`} className="chip-row">
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
export function fuelFilter(products: Product[], basePath: string, active?: Fuel, extra: Record<string, string> = {}): FilterRow {
  const href = (fuel?: Fuel) => {
    const params = new URLSearchParams(extra);
    if (fuel) params.set("combustivel", fuel);
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const fuels = (Object.keys(FUELS) as Fuel[]).filter((f) => products.some((p) => p.fuel === f));
  return {
    label: "Combustível",
    options: [{ label: "Todos", href: href(), active: !active }, ...fuels.map((f) => ({ label: FUELS[f], href: href(f), active: active === f }))],
  };
}

export default function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <p style={{ fontSize: "15px", color: "rgba(242,236,226,0.6)", margin: "0 0 24px" }}>
        Não há modelos em exposição com este filtro.{" "}
        <Link href="/pedir-orcamento" style={{ color: "#e2a276" }}>Peça-nos aconselhamento</Link> — trabalhamos com muitos mais.
      </p>
    );
  }

  return (
    <div className="grid-cards">
      {products.map((product, i) => (
        <AnimateIn key={`${product.category}-${product.brand}-${product.name}-${i}`} delay={(i % 3) * 80}>
          <div className="card-hover" style={{ background: "#2a1a0c", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="product-img-zoom" style={{ position: "relative", aspectRatio: "4 / 3", background: "#3d2a18", overflow: "hidden" }}>
              <img src={product.img} alt={`${product.brand} — ${product.name}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              {product.badge && (
                <span style={{ position: "absolute", top: "12px", left: "12px", background: "#bf5b2d", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px" }}>
                  {product.badge}
                </span>
              )}
            </div>
            <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#e2a276" }}>{product.brand}</div>
              <div style={{ fontSize: "17px", fontWeight: 600, color: "#f2ece2" }}>{product.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "auto", paddingTop: "14px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(242,236,226,0.6)", background: "rgba(242,236,226,0.07)", padding: "4px 10px", borderRadius: "999px" }}>
                  {FUELS[product.fuel]}
                </span>
                <Link href={quoteHref(product.category, product.fuel)} style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
                  Pedir orçamento →
                </Link>
              </div>
            </div>
          </div>
        </AnimateIn>
      ))}
    </div>
  );
}
