import PachinhaLogo from "./PachinhaLogo";

const footerLinks: Record<string, string[]> = {
  Empresa: ["Sobre nós", "Instalações", "Showroom", "Outlet"],
  Suporte: ["Contactos", "Pedir orçamento", "FAQ", "Garantias"],
  Idioma: ["Português", "Español", "Français", "English"],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "#262019",
        color: "#f2ece2",
        padding: "44px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "48px",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <PachinhaLogo dark scale={0.75} />
        <div
          style={{
            fontSize: "13px",
            color: "rgba(242,236,226,0.65)",
            lineHeight: 1.6,
          }}
        >
          Parque Industrial da Lagoa
          <br />
          4950 Monção
        </div>
        <div
          style={{ fontSize: "12.5px", color: "rgba(242,236,226,0.5)" }}
        >
          © {new Date().getFullYear()} Lareiras Pachinha
        </div>
      </div>

      <div style={{ display: "flex", gap: "48px" }}>
        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#e2a276",
                marginBottom: "16px",
              }}
            >
              {heading}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {links.map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    fontSize: "13px",
                    color: "rgba(242,236,226,0.75)",
                    textDecoration: "none",
                  }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
