import AnimateIn from "./AnimateIn";

const products = [
  { category: "RECUPERADOR · LENHA",    brand: "Cheminées Philippe", name: "Recuperador a lenha",         img: "/images/prod1.jpg", badge: "Importador" },
  { category: "LAREIRA · GÁS",          brand: "Bellfires",          name: "Lareira a gás de canto",      img: "/images/prod2.jpg", badge: "Mais vendido" },
  { category: "SALAMANDRA · LENHA",     brand: "Godin",              name: "Salamandra em ferro fundido", img: "/images/prod3.jpg", badge: "Importador" },
];

export default function FeaturedProducts() {
  return (
    <section style={{ background: "#1a1108", padding: "80px 52px 80px" }}>
      <AnimateIn style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          Em destaque
        </h2>
        <a href="#marcas" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          Ver marcas →
        </a>
      </AnimateIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
        {products.map((product, i) => (
          <AnimateIn key={`${product.brand}-${product.name}`} delay={i * 100}>
            <div
              className="card-hover"
              style={{ background: "#2a1a0c", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <div className="product-img-zoom" style={{ position: "relative", height: "240px", background: "#3d2a18", flexShrink: 0, overflow: "hidden" }}>
                <img src={product.img} alt={`${product.brand} — ${product.name}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
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
                  {product.brand} — {product.name}
                </div>
                <a href="/pedir-orcamento" style={{ marginTop: "12px", fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
                  Pedir informação →
                </a>
              </div>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
