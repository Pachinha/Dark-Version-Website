import Link from "next/link";
import AnimateIn from "./AnimateIn";
import { CATEGORIES, FUELS, MAIN_FUELS } from "@/lib/catalog";

// Produtos por tipo e, logo abaixo, por combustível — como nos sites que a Sandra enviou.
export default function Categories() {
  return (
    <section id="produtos" className="sec" style={{ background: "#1a1108", padding: "80px 52px 72px" }}>
      <AnimateIn className="head-row" style={{ marginBottom: "28px" }}>
        <h2 className="sec-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          Produtos
        </h2>
        <Link href="/produtos" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          Ver todos →
        </Link>
      </AnimateIn>

      <div className="grid-categories">
        {CATEGORIES.map((cat, i) => (
          <AnimateIn key={cat.slug} delay={i * 80}>
            <Link
              href={cat.href}
              className="card-hover"
              style={{ background: "#2a1a0c", borderRadius: "14px", padding: "12px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}
            >
              <div style={{ aspectRatio: "4 / 3", borderRadius: "8px", overflow: "hidden", background: "#3d2a18" }}>
                <img src={cat.img} alt={cat.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#f2ece2" }}>{cat.label}</span>
            </Link>
          </AnimateIn>
        ))}

        <AnimateIn delay={5 * 80}>
          <Link
            href="/outlet"
            className="outlet-card"
            style={{ background: "#bf5b2d", borderRadius: "14px", padding: "16px", textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: "140px" }}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Outlet</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>Exposição e últimas unidades →</span>
          </Link>
        </AnimateIn>
      </div>

      <AnimateIn>
        <nav className="fuel-strip" aria-label="Produtos por combustível">
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)", marginRight: "6px" }}>
            Por combustível
          </span>
          {MAIN_FUELS.map((f) => (
            <Link key={f} href={`/produtos?combustivel=${f}`}>{FUELS[f]}</Link>
          ))}
        </nav>
      </AnimateIn>
    </section>
  );
}
