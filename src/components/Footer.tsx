import Link from "next/link";
import PachinhaLogo from "./PachinhaLogo";
import CookieSettingsButton from "./CookieSettingsButton";
import BrandTicker from "./BrandTicker";
import { CATEGORIES } from "@/lib/catalog";
import { CONTACT, telHref } from "@/lib/company";

const linkStyle = {
  fontSize: "13px",
  color: "rgba(242,236,226,0.75)",
  textDecoration: "none",
};

const headStyle = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#e2a276",
  marginBottom: "16px",
};

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Produtos: [...CATEGORIES.map((c) => ({ label: c.label, href: c.href })), { label: "Outlet", href: "/outlet" }],
  Empresa: [
    { label: "Sobre nós", href: "/sobre" },
    { label: "Obras realizadas", href: "/obras" },
    { label: "Marcas que importamos", href: "/#marcas" },
    { label: "Showroom e contactos", href: "/#contactos" },
  ],
  Clientes: [
    { label: "Pedir orçamento", href: "/pedir-orcamento" },
    { label: "Apoio ao cliente", href: "/apoio-ao-cliente" },
    { label: "Pedir assistência", href: "/conta/manutencao" },
    { label: "Área de cliente", href: "/conta" },
  ],
};

const legalLinks = [
  { label: "Política de Privacidade", href: "/privacidade" },
  { label: "Política de Cookies", href: "/cookies" },
  { label: "Termos de Utilização", href: "/termos" },
  { label: "Livro de Reclamações", href: "https://www.livroreclamacoes.pt" },
];

export default function Footer() {
  return (
    <>
      <BrandTicker />
      <footer
        className="site-footer"
        style={{ background: "#262019", color: "#f2ece2", padding: "44px 48px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "48px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <PachinhaLogo dark scale={0.75} />
          <div style={{ fontSize: "13px", color: "rgba(242,236,226,0.65)", lineHeight: 1.6 }}>
            {CONTACT.address.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {CONTACT.phone && (
              <a href={telHref(CONTACT.phone)} style={{ ...linkStyle, display: "block" }}>{CONTACT.phone}</a>
            )}
            <a href={`mailto:${CONTACT.email}`} style={{ ...linkStyle, display: "block" }}>{CONTACT.email}</a>
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(242,236,226,0.5)" }}>© {new Date().getFullYear()} Lareiras Pachinha</div>
        </div>

        <div className="site-footer-cols" style={{ display: "flex", gap: "48px" }}>
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <div style={headStyle}>{heading}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {links.map((link) => (
                  <Link key={link.href} href={link.href} style={linkStyle}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div style={headStyle}>Legal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} style={linkStyle}>
                  {link.label}
                </Link>
              ))}
              <CookieSettingsButton style={linkStyle} />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
