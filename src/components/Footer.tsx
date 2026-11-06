import Link from "next/link";
import PachinhaLogo from "./PachinhaLogo";
import CookieSettingsButton from "./CookieSettingsButton";
import { getCatalog } from "@/lib/catalog-data";
import { CONTACT, telHref } from "@/lib/company";
import { getI18n } from "@/lib/i18n/server";

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

export default async function Footer() {
  const { locale, t, href } = await getI18n();
  const { categories } = await getCatalog(locale);
  const f = t.footer;
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    [f.products]: [
      ...categories.map((c) => ({ label: c.name, href: href(c.href) })),
      { label: t.nav.outlet, href: href("/outlet") },
    ],
    [f.company]: [
      { label: t.nav.about, href: href("/sobre") },
      { label: t.nav.works, href: href("/obras") },
      { label: f.importedBrands, href: href("/#marcas") },
      { label: f.showroom, href: href("/#contactos") },
    ],
    [f.clients]: [
      { label: t.common.requestQuote, href: href("/pedir-orcamento") },
      { label: t.nav.support, href: href("/apoio-ao-cliente") },
      { label: f.requestService, href: href("/pedir-servico") },
      { label: t.common.clientArea, href: "/conta" },
    ],
  };
  const legalLinks = [
    { label: f.privacy, href: href("/privacidade") },
    { label: f.cookies, href: href("/cookies") },
    { label: f.terms, href: href("/termos") },
    { label: f.complaints, href: "https://www.livroreclamacoes.pt" },
  ];
  return (
    // Sempre no fim da página: em páginas curtas o margin-top:auto empurra-o para o fundo do ecrã.
    <div className="site-foot">
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
            <div style={headStyle}>{f.legal}</div>
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
    </div>
  );
}
