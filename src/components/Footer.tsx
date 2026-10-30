import PachinhaLogo from "./PachinhaLogo";
import CookieSettingsButton from "./CookieSettingsButton";

const legalLinks = [
  { label: "Área de cliente", href: "/conta" },
  { label: "Política de Privacidade", href: "/privacidade" },
  { label: "Política de Cookies", href: "/cookies" },
  { label: "Termos de Utilização", href: "/termos" },
  { label: "Livro de Reclamações", href: "https://www.livroreclamacoes.pt" },
];

const legalLinkStyle = {
  fontSize: "13px",
  color: "rgba(242,236,226,0.75)",
  textDecoration: "none",
};

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Empresa: [
    { label: "Sobre nós", href: "/sobre" },
    { label: "Obras realizadas", href: "/obras" },
    { label: "Showroom", href: "#" },
    { label: "Outlet", href: "/outlet" },
  ],
  Suporte: [
    { label: "Apoio ao cliente", href: "/apoio-ao-cliente" },
    { label: "Pedir orçamento", href: "/pedir-orcamento" },
    { label: "Pedir assistência", href: "/conta/manutencao" },
    { label: "Contactos", href: "#" },
  ],
  Idioma: [
    { label: "Português", href: "#" },
    { label: "Español", href: "#" },
    { label: "Français", href: "#" },
    { label: "English", href: "#" },
  ],
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
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: "13px",
                    color: "rgba(242,236,226,0.75)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
        <div>
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
            Legal
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {legalLinks.map((link) => (
              <a key={link.href} href={link.href} style={legalLinkStyle}>
                {link.label}
              </a>
            ))}
            <CookieSettingsButton style={legalLinkStyle} />
          </div>
        </div>
      </div>
    </footer>
  );
}
