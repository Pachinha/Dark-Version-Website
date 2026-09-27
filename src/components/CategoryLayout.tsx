import Navbar from "./Navbar";
import AnimateIn from "./AnimateIn";
import Footer from "./Footer";

interface Product {
  name: string;
  desc: string;
  img: string;
  badge?: string;
}

interface Props {
  category: string;
  title: string;
  subtitle: string;
  heroImg: string;
  accentColor?: string;
  products: Product[];
}

export default function CategoryLayout({ category, title, subtitle, heroImg, products }: Props) {
  return (
    <>
      {/* Hero da categoria */}
      <div style={{ position: "relative", height: "60svh" }}>
        <section style={{ height: "60svh", position: "relative", overflow: "hidden" }}>
          <img
            src={heroImg}
            alt={title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            loading="eager"
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(14,9,4,0.88) 0%, rgba(14,9,4,0.80) 40%, rgba(14,9,4,0.30) 70%, transparent 90%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "52px", maxWidth: "480px", zIndex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
              {category}
            </span>
            <h1 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "44px", lineHeight: 1.08, fontWeight: 700, margin: "0 0 16px", color: "#ffffff" }}>
              {title}
            </h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(255,255,255,0.65)", margin: "0 0 28px" }}>
              {subtitle}
            </p>
            <a
              href="#orcamento"
              className="btn-primary"
              style={{ background: "#bf5b2d", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none", display: "inline-block" }}
            >
              Pedir orçamento grátis →
            </a>
          </div>
        </section>
        <Navbar />
      </div>

      {/* Produtos */}
      <main style={{ background: "#1a1108" }}>
        <section style={{ padding: "72px 52px 80px" }}>
          <AnimateIn style={{ marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "28px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
              Modelos em destaque
            </h2>
            <a href="/" style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
              ← Voltar à página inicial
            </a>
          </AnimateIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
            {products.map((product, i) => (
              <AnimateIn key={product.name} delay={i * 100}>
                <div
                  className="card-hover"
                  style={{ background: "#2a1a0c", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  <div className="product-img-zoom" style={{ position: "relative", height: "240px", background: "#3d2a18", flexShrink: 0, overflow: "hidden" }}>
                    <img src={product.img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                    {product.badge && (
                      <span style={{ position: "absolute", top: "12px", left: "12px", background: "#bf5b2d", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px" }}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <div style={{ fontSize: "17px", fontWeight: 600, color: "#f2ece2" }}>{product.name}</div>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(242,236,226,0.52)", margin: "0 0 12px" }}>{product.desc}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <span style={{ fontSize: "13px", color: "rgba(242,236,226,0.35)" }}>Sob consulta</span>
                      <a href="#orcamento" className="btn-glass" style={{ background: "rgba(242,236,226,0.10)", color: "#f2ece2", fontSize: "13px", fontWeight: 600, padding: "9px 16px", borderRadius: "999px", textDecoration: "none", border: "1px solid rgba(242,236,226,0.15)", display: "inline-block" }}>
                        Pedir orçamento
                      </a>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section id="orcamento" style={{ padding: "0 52px 80px" }}>
          <AnimateIn>
            <div style={{ background: "#262019", borderRadius: "20px", padding: "56px 52px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "28px", fontWeight: 700, color: "#f2ece2", margin: "0 0 10px" }}>
                  Pronto para aquecer o seu espaço?
                </h2>
                <p style={{ fontSize: "14.5px", color: "rgba(242,236,226,0.60)", margin: 0 }}>
                  Visita técnica gratuita. Orçamento sem compromisso.
                </p>
              </div>
              <a
                href="tel:+351251652000"
                className="btn-primary"
                style={{ background: "#bf5b2d", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "14px 28px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap", display: "inline-block", flexShrink: 0 }}
              >
                Falar connosco →
              </a>
            </div>
          </AnimateIn>
        </section>
      </main>

      <Footer />
    </>
  );
}
