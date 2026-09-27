import BrandTicker from "./BrandTicker";

const stats = [
  { value: "30+",    label: "anos" },
  { value: "1.000+", label: "instalações" },
  { value: "12",     label: "marcas" },
  { value: "PT + ES", label: "línguas" },
];

export default function Hero() {
  return (
    <section style={{ height: "100svh", position: "relative", overflow: "hidden" }}>

      {/* ── Background image ── */}
      <img
        src="/images/hero.png"
        alt="Sala de estar com recuperador Pachinha aceso"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
        loading="eager"
      />

      {/* ── Overlay escuro à esquerda ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(14,9,4,0.92) 0%, rgba(14,9,4,0.88) 36%, rgba(14,9,4,0.40) 56%, rgba(14,9,4,0.05) 72%, transparent 82%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Conteúdo principal — lado esquerdo ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: "52px",
          maxWidth: "420px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Label */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#e2a276",
          }}
        >
          Desde 1990 &middot; Portugal e Espanha
        </span>

        {/* Título */}
        <h1
          style={{
            fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif",
            fontSize: "52px",
            lineHeight: 1.06,
            fontWeight: 700,
            margin: 0,
            color: "#ffffff",
          }}
        >
          Aquecimento com quem sabe, desde 1990.
        </h1>

        {/* Descrição */}
        <p
          style={{
            fontSize: "13.5px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.60)",
            margin: 0,
          }}
        >
          Lareiras, recuperadores e salamandras a lenha, gás, pellets e
          bioetanol — com aconselhamento técnico e instalação incluída.
        </p>

        {/* Botões */}
        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href="#orcamento"
            className="btn-primary"
            style={{
              background: "#bf5b2d",
              color: "#fff",
              fontSize: "13.5px",
              fontWeight: 600,
              padding: "13px 22px",
              borderRadius: "999px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            Pedir orçamento grátis →
          </a>
          <a
            href="#produtos"
            className="btn-outline"
            style={{
              background: "transparent",
              color: "#fff",
              fontSize: "13.5px",
              fontWeight: 600,
              padding: "13px 22px",
              borderRadius: "999px",
              textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.45)",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            Ver produtos
          </a>
        </div>

        {/* Já é cliente */}
        <a
          href="/manutencao"
          className="cliente-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            marginTop: "-2px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(226,162,118,0.80)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.50)" }}>
            Já é cliente?{" "}
            <span style={{ color: "rgba(226,162,118,0.85)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Agende manutenção ou limpeza
            </span>
          </span>
        </a>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            marginTop: "4px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                paddingRight: i < stats.length - 1 ? "28px" : 0,
                paddingLeft: i > 0 ? "28px" : 0,
                borderLeft:
                  i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              <span
                style={{
                  fontFamily:
                    "var(--font-archivo-expanded), system-ui, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#ffffff",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.45)",
                  whiteSpace: "nowrap",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fade de fundo — dissolve a imagem para #1a1108 ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "32svh",
          background: "linear-gradient(to bottom, transparent 0%, rgba(26,17,8,0.65) 55%, #1a1108 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Ticker de marcas — fundo do viewport ── */}
      <BrandTicker />
    </section>
  );
}
