import AnimateIn from "./AnimateIn";

const testimonials = [
  {
    quote: "Excelente atendimento desde o primeiro contacto. A equipa fez a visita técnica rapidamente e a instalação foi impecável. A lareira ficou exactamente como imaginámos.",
    name: "Ana Rodrigues",
    location: "Viana do Castelo",
    avatar: "https://ui-avatars.com/api/?name=Ana+Rodrigues&background=bf5b2d&color=fff&size=80",
    product: "Lareira a gás Bellfires",
  },
  {
    quote: "Compramos um recuperador há três anos e ainda parece novo. A assistência pós-venda é muito boa — qualquer dúvida, estão sempre disponíveis.",
    name: "João Ferreira",
    location: "Monção",
    avatar: "https://ui-avatars.com/api/?name=Joao+Ferreira&background=262019&color=f6f2ec&size=80",
    product: "Recuperador Barbas Vitro 90",
  },
  {
    quote: "O showroom tem uma variedade enorme. Fomos sem ideia do que queríamos e saímos com tudo decidido. A salamandra de pellets já passou dois invernos sem uma avaria.",
    name: "Maria José Silva",
    location: "Valença",
    avatar: "https://ui-avatars.com/api/?name=Maria+Silva&background=e2a276&color=262019&size=80",
    product: "Salamandra Ravelli R 80 V",
  },
];

function Stars() {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#bf5b2d" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      <AnimateIn style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "36px" }}>
        <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
          O que dizem os clientes
        </h2>
        <a href="#" style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
          Ver todas as avaliações →
        </a>
      </AnimateIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
        {testimonials.map((t, i) => (
          <AnimateIn key={t.name} delay={i * 100}>
            <div
              className="card-hover"
              style={{ background: "#2a1a0c", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Stars />
              <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.80)", margin: 0, flex: 1 }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ fontSize: "11.5px", color: "#e2a276", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t.product}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={t.avatar} alt={t.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", background: "#3d2a18", flexShrink: 0 }} loading="lazy" />
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#f2ece2" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(242,236,226,0.40)" }}>{t.location}</div>
                </div>
              </div>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
