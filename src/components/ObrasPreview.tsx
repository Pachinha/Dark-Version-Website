import Link from "next/link";
import AnimateIn from "./AnimateIn";
import { PROJECTS, projectTypeSlug } from "@/lib/portfolio";
import { getI18n } from "@/lib/i18n/server";

// Amostra do portfólio na página inicial — a Sandra pediu um "portfolio - obras realizadas".
export default async function ObrasPreview() {
  const { t, href } = await getI18n();
  return (
    <section className="sec" style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      <AnimateIn className="head-row" style={{ marginBottom: "28px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "10px" }}>
            {t.home.portfolio}
          </span>
          <h2 className="sec-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
            {t.nav.works}
          </h2>
        </div>
        <Link href={href("/obras")} style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          {t.home.seeAllWorks}
        </Link>
      </AnimateIn>

      <div className="grid-cards">
        {PROJECTS.slice(0, 3).map((p, i) => (
          <AnimateIn key={`${p.title}-${i}`} delay={i * 80}>
            <Link href={href(`/obras?tipo=${encodeURIComponent(p.type)}`)} className="product-img-zoom" style={{ display: "block", position: "relative", borderRadius: "16px", overflow: "hidden", background: "#3d2a18", aspectRatio: "4 / 3", textDecoration: "none" }}>
              <img src={p.img} alt={t.works.projects[p.title] ?? p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 20px 18px", background: "linear-gradient(to top, rgba(14,9,4,0.92) 0%, transparent 100%)" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e2a276", display: "block" }}>{t.catalog.categories[projectTypeSlug(p.type)].label}</span>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", display: "block", marginTop: "4px" }}>{t.works.projects[p.title] ?? p.title}</span>
              </span>
            </Link>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
