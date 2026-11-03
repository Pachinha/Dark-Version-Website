import Link from "next/link";
import { CATEGORIES, FUELS, MAIN_FUELS } from "@/lib/catalog";

const navLinks = [
  { label: "Sobre nós", href: "/sobre" },
  { label: "Obras realizadas", href: "/obras" },
  { label: "Apoio ao cliente", href: "/apoio-ao-cliente" },
];

const fuelLinks = MAIN_FUELS.map((f) => ({ label: FUELS[f], href: `/produtos?combustivel=${f}` }));

// Menu como nos sites de referência: produtos por tipo e por combustível.
// No telemóvel, o menu abre num painel (<details>, sem JavaScript).
export default function Navbar() {
  return (
    <nav className="site-nav">
      <Link href="/" style={{ display: "block", lineHeight: 0 }}>
        <img src="/images/logo.png" alt="Lareiras Pachinha" className="site-nav-logo" />
      </Link>

      <div className="site-nav-links">
        <div className="nav-dropdown">
          <Link href="/produtos" className="nav-link-hero" aria-haspopup="true">
            Produtos <span aria-hidden style={{ fontSize: "10px", marginLeft: "2px" }}>▾</span>
          </Link>
          <div className="nav-menu nav-menu-cols">
            <div>
              <span className="nav-menu-head">Por tipo</span>
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={c.href}>{c.label}</Link>
              ))}
            </div>
            <div>
              <span className="nav-menu-head">Por combustível</span>
              {fuelLinks.map((f) => (
                <Link key={f.href} href={f.href}>{f.label}</Link>
              ))}
            </div>
          </div>
        </div>
        {navLinks.map((link) => (
          <Link key={link.label} href={link.href} className="nav-link-hero">
            {link.label}
          </Link>
        ))}
        <Link href="/outlet" className="nav-link-hero-outlet">
          Outlet
        </Link>
      </div>

      <div className="site-nav-actions">
        <Link href="/conta" className="nav-link-hero">
          Área de cliente
        </Link>
        <Link href="/pedir-orcamento" className="btn-primary site-nav-cta">
          Pedir orçamento
        </Link>
      </div>

      <details className="mobile-menu">
        <summary aria-label="Abrir menu">
          <span />
          <span />
          <span />
        </summary>
        <div className="mobile-menu-panel">
          <span className="nav-menu-head">Produtos</span>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={c.href}>{c.label}</Link>
          ))}
          <div className="mobile-menu-fuels">
            {fuelLinks.map((f) => (
              <Link key={f.href} href={f.href}>{f.label}</Link>
            ))}
          </div>
          <span className="nav-menu-head">Pachinha</span>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
          <Link href="/outlet" style={{ color: "#e2a276" }}>Outlet</Link>
          <Link href="/conta">Área de cliente</Link>
          <Link href="/pedir-orcamento" className="btn-primary mobile-menu-cta">Pedir orçamento</Link>
        </div>
      </details>
    </nav>
  );
}
