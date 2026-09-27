import AnimateIn from "./AnimateIn";

const products = [
  {
    category: "RECUPERADOR · LENHA",
    name: "Barbas — Vitro 90",
    desc: "Rendimento superior a 80%, potência 14 kW. Vidro panorâmico e câmara dupla combustão. Ideal para 80–120 m².",
    img: "/images/prod1.jpg",
    alt: "Recuperador de calor Barbas Vitro 90",
    badge: null,
  },
  {
    category: "LAREIRA · GÁS",
    name: "Bellfires — Bay Angular",
    desc: "Chama realista a gás natural ou GPL. Encaixe em ângulo para canto de sala. Design minimalista holandês.",
    img: "/images/prod2.jpg",
    alt: "Lareira a gás Bellfires Bay Angular",
    badge: "Mais vendido",
  },
  {
    category: "SALAMANDRA · PELLETS",
    name: "Ravelli — R 80 V",
    desc: "Termostato digital, ventoinhas silenciosas. Aquece até 120 m². Controlo por WiFi disponível.",
    img: "/images/prod3.jpg",
    alt: "Salamandra a pellets Ravelli R80V",
    badge: null,
  },
];

export default function FeaturedProducts() {
  return (
    <section style={{ background: "#1a1108", padding: "80px 52px 80px" }}>
      <AnimateIn style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          Em destaque
        </h2>
        <a href="#" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          Ver catálogo →
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
                <img src={product.img} alt={product.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                {product.badge && (
                  <span style={{ position: "absolute", top: "12px", left: "12px", background: "#bf5b2d", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.04em" }}>
                    {product.badge}
                  </span>
                )}
              </div>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#e2a276" }}>
                  {product.category}
                </div>
                <div style={{ fontSize: "17px", fontWeight: 600, color: "#f2ece2" }}>
                  {product.name}
                </div>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(242,236,226,0.52)", margin: "4px 0 12px" }}>
                  {product.desc}
                </p>
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
  );
}
