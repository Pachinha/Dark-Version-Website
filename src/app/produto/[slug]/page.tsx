import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimateIn from "@/components/AnimateIn";
import ProductGallery from "@/components/ProductGallery";
import ProductGrid, { badgeOf } from "@/components/ProductGrid";
import { quoteHref } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { fmt, formatNumber } from "@/lib/i18n/config";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

type Params = { params: Promise<{ slug: string }> };

async function findProduct(slug: string) {
  const { locale } = await getI18n();
  const { products } = await getCatalog(locale);
  return { product: products.find((p) => p.slug === slug), products };
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const { product } = await findProduct(slug);
  if (!product) return pageMetadata((t) => t.notFound.meta);
  return pageMetadata(() => `${product.brand.name} ${product.name}`, {
    description: product.description.slice(0, 160) || undefined,
  });
}

// Página de um modelo: fotos, características, descrição e pedido de orçamento já com o modelo.
// Tudo o que aqui aparece é editado no painel (Catálogo → Produtos).
export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params;
  const { locale, t, href } = await getI18n();
  const { product, products } = await findProduct(slug);
  if (!product) notFound();
  const tp = t.product;

  const specs = [
    { label: tp.fuel, value: t.catalog.fuels[product.fuel] },
    product.powerKw && { label: tp.power, value: `${formatNumber(locale, product.powerKw)} kW` },
    product.heatedArea && { label: tp.area, value: fmt(tp.areaValue, { n: product.heatedArea }) },
    product.efficiency && { label: tp.efficiency, value: `${formatNumber(locale, product.efficiency)}%` },
    product.energyClass && { label: tp.energyClass, value: product.energyClass },
    product.dimensions && { label: tp.dimensions, value: product.dimensions },
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  const related = products.filter((p) => p.category.slug === product.category.slug && p.slug !== product.slug && !p.outlet).slice(0, 3);
  const badge = badgeOf(product, t);
  const fullName = `${product.brand.name} ${product.name}`;

  return (
    <>
      <div style={{ position: "relative", background: "#1a1108" }}>
        <Navbar />
        <main className="sec" style={{ padding: "140px 52px 72px", color: "#f2ece2" }}>
          <nav aria-label="breadcrumb" className="product-crumbs">
            <Link href={href("/produtos")}>{t.nav.products}</Link>
            <span aria-hidden>›</span>
            <Link href={href(product.category.href)}>{product.category.name}</Link>
          </nav>

          <div className="product-layout">
            <ProductGallery
              photos={product.photos}
              alts={product.photos.map((_, i) => fmt(tp.photo, { name: fullName, n: i + 1 }))}
              emptyLabel={tp.noPhoto}
            />

            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e2a276" }}>
                {product.brand.name}
              </div>
              <h1 className="product-title">{product.name}</h1>
              <div className="chip-row" style={{ marginBottom: "18px" }}>
                <span className="product-chip">{t.catalog.fuels[product.fuel]}</span>
                {badge && <span className="product-chip product-chip-fire">{badge}</span>}
              </div>

              {product.description.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i} style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(242,236,226,0.7)", margin: "0 0 14px", whiteSpace: "pre-line" }}>
                  {para}
                </p>
              ))}

              <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(242,236,226,0.5)", margin: "24px 0 10px" }}>
                {tp.specs}
              </h2>
              <dl className="product-specs">
                {specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "28px" }}>
                <Link
                  href={href(quoteHref(product.category.slug, product.fuel, fullName))}
                  className="btn-primary"
                  style={{ background: "#bf5b2d", color: "#fff", fontSize: "14.5px", fontWeight: 600, padding: "15px 26px", borderRadius: "999px", textDecoration: "none", alignSelf: "flex-start" }}
                >
                  {tp.cta}
                </Link>
                <span style={{ fontSize: "13px", color: "rgba(242,236,226,0.5)" }}>{tp.ctaLead}</span>
                <div className="row" style={{ gap: "18px", marginTop: "6px" }}>
                  {product.brand.catalogUrl && (
                    <a href={product.brand.catalogUrl} target="_blank" rel="noreferrer" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
                      {t.home.seeCatalog}{product.brand.catalogLabel && ` ${product.brand.catalogLabel}`} →
                    </a>
                  )}
                  {product.brand.website && (
                    <a href={product.brand.website} target="_blank" rel="noreferrer" style={{ fontSize: "13.5px", fontWeight: 600, color: "rgba(242,236,226,0.6)", textDecoration: "none" }}>
                      {tp.brandSite}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <AnimateIn style={{ marginTop: "72px" }}>
              <h2 className="sec-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "26px", fontWeight: 700, margin: "0 0 24px" }}>
                {fmt(tp.related, { category: product.category.name })}
              </h2>
              <ProductGrid products={related} />
            </AnimateIn>
          )}

          <p style={{ marginTop: "40px" }}>
            <Link href={href("/produtos")} style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>{tp.back}</Link>
          </p>
        </main>
      </div>
      <Footer />
    </>
  );
}
