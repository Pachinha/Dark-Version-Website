import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnimateIn from "@/components/AnimateIn";
import Footer from "@/components/Footer";
import { PROJECTS, projectTypeSlug, type Project } from "@/lib/portfolio";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.works.meta);

const TYPES: Project["type"][] = ["Lareiras", "Recuperadores", "Salamandras", "Fogões", "Churrasqueiras"];

export default async function ObrasPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { t, href } = await getI18n();
  const w = t.works;
  const typeLabel = (type: Project["type"]) => t.catalog.categories[projectTypeSlug(type)].label;
  const title = (p: Project) => w.projects[p.title] ?? p.title;
  const { tipo } = await searchParams;
  const active = TYPES.find((type) => type === tipo);
  const projects = active ? PROJECTS.filter((p) => p.type === active) : PROJECTS;
  const usedTypes = TYPES.filter((t) => PROJECTS.some((p) => p.type === t));

  const chip = (selected: boolean) => ({
    fontSize: "13px",
    fontWeight: 600,
    padding: "8px 16px",
    borderRadius: "999px",
    textDecoration: "none",
    border: `1px solid ${selected ? "#f2ece2" : "rgba(242,236,226,0.2)"}`,
    background: selected ? "#f2ece2" : "transparent",
    color: selected ? "#262019" : "rgba(242,236,226,0.8)",
  });

  return (
    <>
      <div style={{ position: "relative", height: "50svh" }}>
        <section style={{ height: "50svh", position: "relative", overflow: "hidden", background: "#1a1108" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(191,91,45,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div className="hero-inline" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "52px", maxWidth: "560px", zIndex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
              {w.eyebrow}
            </span>
            <h1 className="hero-inline-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "44px", lineHeight: 1.08, fontWeight: 700, margin: "0 0 16px", color: "#f2ece2" }}>
              {w.title}
            </h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.60)", margin: 0 }}>
              {w.lead}
            </p>
          </div>
        </section>
        <Navbar />
      </div>

      <main style={{ background: "#1a1108" }}>
        <section className="sec" style={{ padding: "56px 52px 80px" }}>
          <nav aria-label={w.filterAria} style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
            <Link href={href("/obras")} style={chip(!active)} aria-current={!active ? "page" : undefined}>{t.common.allFem}</Link>
            {usedTypes.map((type) => (
              <Link key={type} href={href(`/obras?tipo=${encodeURIComponent(type)}`)} style={chip(active === type)} aria-current={active === type ? "page" : undefined}>
                {typeLabel(type)}
              </Link>
            ))}
          </nav>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "18px" }}>
            {projects.map((p, i) => (
              <AnimateIn key={`${p.title}-${i}`} delay={(i % 3) * 80}>
                <figure className="product-img-zoom" style={{ margin: 0, position: "relative", borderRadius: "16px", overflow: "hidden", background: "#3d2a18", aspectRatio: "4 / 3" }}>
                  <img src={p.img} alt={title(p)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  <figcaption style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 20px 18px", background: "linear-gradient(to top, rgba(14,9,4,0.92) 0%, transparent 100%)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e2a276" }}>{typeLabel(p.type)}</span>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", marginTop: "4px" }}>{title(p)}</div>
                    {(p.location || p.equipment) && (
                      <div style={{ fontSize: "12.5px", color: "rgba(242,236,226,0.6)", marginTop: "2px" }}>
                        {[p.location, p.equipment].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </figcaption>
                </figure>
              </AnimateIn>
            ))}
          </div>
        </section>

        <section className="sec" style={{ padding: "0 52px 80px" }}>
          <AnimateIn>
            <div className="band" style={{ background: "#262019", borderRadius: "20px", padding: "48px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "26px", fontWeight: 700, color: "#f2ece2", margin: "0 0 8px" }}>
                  {w.ctaTitle}
                </h2>
                <p style={{ fontSize: "14.5px", color: "rgba(242,236,226,0.60)", margin: 0 }}>{w.ctaLead}</p>
              </div>
              <Link href={href("/pedir-orcamento")} className="btn-primary" style={{ background: "#bf5b2d", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "14px 28px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap" }}>
                {t.common.makeRequest}
              </Link>
            </div>
          </AnimateIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
