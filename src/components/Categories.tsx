import AnimateIn from "./AnimateIn";

const categories = [
  { name: "Lareiras",       img: "/images/lareira.jpg",       alt: "Lareira embutida com lume aceso" },
  { name: "Recuperadores",  img: "/images/recuperador.jpg",   alt: "Recuperador a lenha instalado" },
  { name: "Salamandras",    img: "/images/salamandra.jpg",    alt: "Salamandra a lenha" },
  { name: "Fogões",         img: "/images/fogao.jpg",         alt: "Fogão a lenha de cozinha" },
  { name: "Churrasqueiras", img: "/images/churrasqueira.jpg", alt: "Churrasqueira com brasas" },
];

export default function Categories() {
  return (
    <section style={{ background: "#1a1108", padding: "80px 52px 72px" }}>
      <AnimateIn style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          Categorias
        </h2>
        <a href="#" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          Ver todas →
        </a>
      </AnimateIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px" }}>
        {categories.map((cat, i) => (
          <AnimateIn key={cat.name} delay={i * 80}>
            <a
              href="#"
              className="card-hover"
              style={{
                background: "#2a1a0c",
                borderRadius: "14px",
                padding: "12px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ height: "110px", borderRadius: "8px", overflow: "hidden", background: "#3d2a18" }}>
                <img src={cat.img} alt={cat.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#f2ece2" }}>{cat.name}</span>
            </a>
          </AnimateIn>
        ))}

        <AnimateIn delay={5 * 80}>
          <a
            href="#"
            className="outlet-card"
            style={{
              background: "#bf5b2d",
              borderRadius: "14px",
              padding: "16px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "160px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>
              OUTLET
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>Promoções →</span>
          </a>
        </AnimateIn>
      </div>
    </section>
  );
}
