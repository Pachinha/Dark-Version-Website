import AnimateIn from "./AnimateIn";

const details = [
  { label: "Endereço", value: "Parque Industrial da Lagoa, 4950 Monção" },
  { label: "Horário",  value: "Seg–Sex 9h00–18h30 · Sáb 9h00–12h30" },
  { label: "Telefone", value: "+351 251 652 XXX" },
  { label: "Email",    value: "info@lareiraspachinha.pt" },
];

export default function ShowroomBand() {
  return (
    <section style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      <AnimateIn>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "20px", overflow: "hidden", background: "#2a1a0c", minHeight: "440px" }}>
          {/* Texto */}
          <div style={{ padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276" }}>
              Showroom
            </span>
            <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, color: "#f2ece2", margin: "8px 0 16px", lineHeight: 1.15 }}>
              Visite-nos em Monção
            </h2>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.60)", margin: "0 0 28px", maxWidth: "40ch" }}>
              O nosso showroom tem mais de 50 modelos em exposição, com demonstrações ao vivo de lareiras e recuperadores em funcionamento. Venha sentir o calor antes de decidir.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {details.map((d) => (
                <div key={d.label} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(242,236,226,0.35)", minWidth: "76px", flexShrink: 0 }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: "13.5px", color: "#f2ece2" }}>{d.value}</span>
                </div>
              ))}
            </div>

            <a href="#" className="btn-primary" style={{ marginTop: "28px", background: "#bf5b2d", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 24px", borderRadius: "999px", textDecoration: "none", display: "inline-block", alignSelf: "flex-start" }}>
              Ver no mapa →
            </a>
          </div>

          {/* Imagem */}
          <div style={{ background: "#3d2a18", position: "relative", overflow: "hidden" }} className="product-img-zoom">
            <img
              src="/images/showroom.jpg"
              alt="Showroom Lareiras Pachinha em Monção"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
              loading="lazy"
            />
          </div>
        </div>
      </AnimateIn>
    </section>
  );
}
