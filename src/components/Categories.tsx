import Link from "next/link";
import AnimateIn from "./AnimateIn";
import { MAIN_FUELS } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { getI18n } from "@/lib/i18n/server";

// Produtos por tipo e, logo abaixo, por combustível — como nos sites que a Sandra enviou.
export default async function Categories() {
  const { locale, t, href } = await getI18n();
  const { categories } = await getCatalog(locale);
  return (
    <section id="produtos" className="sec" style={{ background: "#1a1108", padding: "80px 52px 72px" }}>
      <AnimateIn className="head-row" style={{ marginBottom: "28px" }}>
        <h2 className="sec-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          {t.nav.products}
        </h2>
        <Link href={href("/produtos")} style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          {t.home.seeAll}
        </Link>
      </AnimateIn>

      <div className="grid-categories">
        {categories.map((cat, i) => (
          <AnimateIn key={cat.slug} delay={i * 80}>
            <Link
              href={href(cat.href)}
              className="card-hover"
              style={{ background: "#2a1a0c", borderRadius: "14px", padding: "12px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}
            >
              <div style={{ aspectRatio: "4 / 3", borderRadius: "8px", overflow: "hidden", background: "#3d2a18" }}>
                <img src={cat.image || "/images/hero.png"} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#f2ece2" }}>{cat.name}</span>
            </Link>
          </AnimateIn>
        ))}

        <AnimateIn delay={categories.length * 80}>
          <Link
            href={href("/outlet")}
            className="outlet-card"
            style={{ background: "#bf5b2d", borderRadius: "14px", padding: "16px", textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: "140px" }}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>{t.nav.outlet}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{t.home.outletCard}</span>
          </Link>
        </AnimateIn>
      </div>

      <AnimateIn>
        <nav className="fuel-strip" aria-label={t.home.fuelAria}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)", marginRight: "6px" }}>
            {t.nav.byFuel}
          </span>
          {MAIN_FUELS.map((f) => (
            <Link key={f} href={href(`/produtos?combustivel=${f}`)}>{t.catalog.fuels[f]}</Link>
          ))}
        </nav>
      </AnimateIn>
    </section>
  );
}
