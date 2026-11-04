import Link from "next/link";
import Navbar from "./Navbar";
import AnimateIn from "./AnimateIn";
import Footer from "./Footer";
import ProductGrid, { Filters, type FilterRow } from "./ProductGrid";
import type { Product } from "@/lib/catalog-data";
import { getI18n } from "@/lib/i18n/server";

interface Props {
  category: string;
  title: string;
  subtitle: string;
  heroImg: string;
  products: Product[];
  filters?: FilterRow[];
  quoteHref?: string;
}

// Página de categoria ao estilo dos sites de referência: cabeçalho curto, filtros simples e grelha de modelos.
export default async function CategoryLayout({ category, title, subtitle, heroImg, products, filters = [], quoteHref = "/pedir-orcamento" }: Props) {
  const { t, href } = await getI18n();
  return (
    <>
      <div style={{ position: "relative", height: "46svh", minHeight: "360px" }}>
        <section style={{ height: "100%", position: "relative", overflow: "hidden" }}>
          <img
            src={heroImg}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            loading="eager"
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(14,9,4,0.9) 0%, rgba(14,9,4,0.8) 45%, rgba(14,9,4,0.35) 75%, rgba(14,9,4,0.2) 100%)", pointerEvents: "none" }} />
          <div className="page-hero-copy">
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
              {category}
            </span>
            <h1 className="page-hero-title">{title}</h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: 0 }}>{subtitle}</p>
          </div>
        </section>
        <Navbar />
      </div>

      <main style={{ background: "#1a1108" }}>
        <section className="sec" style={{ padding: "56px 52px 72px" }}>
          <Filters rows={filters} />
          <ProductGrid products={products} />
          <p style={{ fontSize: "13.5px", color: "rgba(242,236,226,0.5)", margin: "28px 0 0" }}>
            {t.category.moreModels}{" "}
            <Link href={href(quoteHref)} style={{ color: "#e2a276" }}>{t.category.tellUs}</Link>.
          </p>
        </section>

        <section className="sec" style={{ padding: "0 52px 80px" }}>
          <AnimateIn>
            <div className="band" style={{ background: "#262019", borderRadius: "20px", padding: "48px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "26px", fontWeight: 700, color: "#f2ece2", margin: "0 0 8px" }}>
                  {t.category.visitTitle}
                </h2>
                <p style={{ fontSize: "14.5px", color: "rgba(242,236,226,0.60)", margin: 0 }}>
                  {t.category.visitLead}
                </p>
              </div>
              <Link
                href={href(quoteHref)}
                className="btn-primary"
                style={{ background: "#bf5b2d", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "14px 28px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {t.common.requestQuoteArrow}
              </Link>
            </div>
          </AnimateIn>
        </section>
      </main>

      <Footer />
    </>
  );
}
