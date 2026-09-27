import AnimateIn from "./AnimateIn";

const brands = [
  { name: "Barbas",     origin: "Portugal", since: "1976" },
  { name: "Bellfires",  origin: "Holanda",  since: "1983" },
  { name: "Ravelli",    origin: "Itália",   since: "1984" },
  { name: "Edilkamin",  origin: "Itália",   since: "1970" },
  { name: "La Nordica", origin: "Itália",   since: "1969" },
  { name: "MCZ",        origin: "Itália",   since: "1950" },
  { name: "Stuv",       origin: "Bélgica",  since: "1983" },
  { name: "DRU",        origin: "Holanda",  since: "1754" },
  { name: "Camin",      origin: "Portugal", since: "2001" },
];

export default function Brands() {
  return (
    <section style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      <AnimateIn style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
        <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          As nossas marcas
        </h2>
        <a href="#" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          Ver catálogos →
        </a>
      </AnimateIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "12px" }}>
        {brands.map((brand, i) => (
          <AnimateIn key={brand.name} delay={i * 60}>
            <a
              href="#"
              className="brand-card-hover"
              style={{
                background: "#2a1a0c",
                borderRadius: "12px",
                padding: "18px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                border: "1.5px solid transparent",
              }}
            >
              <span style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "#f2ece2", letterSpacing: "-0.01em" }}>
                {brand.name}
              </span>
              <span style={{ fontSize: "11px", color: "rgba(242,236,226,0.4)" }}>
                {brand.origin} · desde {brand.since}
              </span>
            </a>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
