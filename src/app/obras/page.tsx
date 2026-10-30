import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnimateIn from "@/components/AnimateIn";
import Footer from "@/components/Footer";
import { PROJECTS } from "@/lib/portfolio";

export const metadata = { title: "Obras realizadas — Lareiras Pachinha" };

const TYPES = ["Lareiras", "Recuperadores", "Salamandras", "Fogões", "Churrasqueiras"];

export default async function ObrasPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const active = tipo && TYPES.includes(tipo) ? tipo : undefined;
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
          <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "52px", maxWidth: "560px", zIndex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
              Portfólio
            </span>
            <h1 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "44px", lineHeight: 1.08, fontWeight: 700, margin: "0 0 16px", color: "#f2ece2" }}>
              Obras realizadas
            </h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.60)", margin: 0 }}>
              Algumas das lareiras, recuperadores e salamandras que instalámos. Do projeto à instalação, feito pela nossa equipa.
            </p>
          </div>
        </section>
        <Navbar />
      </div>

      <main style={{ background: "#1a1108" }}>
        <section style={{ padding: "56px 52px 80px" }}>
          <nav aria-label="Filtrar obras" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
            <Link href="/obras" style={chip(!active)} aria-current={!active ? "page" : undefined}>Todas</Link>
            {usedTypes.map((t) => (
              <Link key={t} href={`/obras?tipo=${encodeURIComponent(t)}`} style={chip(active === t)} aria-current={active === t ? "page" : undefined}>
                {t}
              </Link>
            ))}
          </nav>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
            {projects.map((p, i) => (
              <AnimateIn key={`${p.title}-${i}`} delay={(i % 3) * 80}>
                <figure className="product-img-zoom" style={{ margin: 0, position: "relative", borderRadius: "16px", overflow: "hidden", background: "#3d2a18", aspectRatio: "4 / 3" }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  <figcaption style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 20px 18px", background: "linear-gradient(to top, rgba(14,9,4,0.92) 0%, transparent 100%)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e2a276" }}>{p.type}</span>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", marginTop: "4px" }}>{p.title}</div>
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

        <section style={{ padding: "0 52px 80px" }}>
          <AnimateIn>
            <div style={{ background: "#262019", borderRadius: "20px", padding: "48px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "26px", fontWeight: 700, color: "#f2ece2", margin: "0 0 8px" }}>
                  Quer uma obra assim em sua casa?
                </h2>
                <p style={{ fontSize: "14.5px", color: "rgba(242,236,226,0.60)", margin: 0 }}>Visita técnica e orçamento sem compromisso.</p>
              </div>
              <Link href="/apoio-ao-cliente" className="btn-primary" style={{ background: "#bf5b2d", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "14px 28px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap" }}>
                Fazer o meu pedido →
              </Link>
            </div>
          </AnimateIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
