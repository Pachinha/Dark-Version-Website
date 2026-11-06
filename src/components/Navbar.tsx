import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { MAIN_FUELS } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { getI18n } from "@/lib/i18n/server";

export type NavSection = "produtos" | "sobre" | "obras" | "apoio" | "outlet";

// Menu como nos sites de referência: produtos por tipo e por combustível.
// No telemóvel, o menu abre num painel (<details>, sem JavaScript).
// current: a secção onde o visitante está fica destacada (na página inicial, nenhuma).
export default async function Navbar({ current }: { current?: NavSection }) {
  const { locale, t, href } = await getI18n();
  const catalog = await getCatalog(locale);
  const navLinks: { label: string; href: string; section: NavSection }[] = [
    { label: t.nav.about, href: "/sobre", section: "sobre" },
    { label: t.nav.works, href: "/obras", section: "obras" },
    { label: t.nav.support, href: "/apoio-ao-cliente", section: "apoio" },
  ];
  const here = (section: NavSection) => (current === section ? ("page" as const) : undefined);
  const fuelLinks = MAIN_FUELS.map((f) => ({ label: t.catalog.fuels[f], href: href(`/produtos?combustivel=${f}`) }));
  const categories = catalog.categories.map((c) => ({ slug: c.slug, label: c.name, href: href(c.href) }));

  return (
    <nav className="site-nav">
      <Link href={href("/")} style={{ display: "block", lineHeight: 0 }}>
        <img src="/images/logo.png" alt="Lareiras Pachinha" className="site-nav-logo" />
      </Link>

      <div className="site-nav-links">
        <div className="nav-dropdown">
          <Link href={href("/produtos")} className="nav-link-hero" aria-haspopup="true" aria-current={here("produtos")}>
            {t.nav.products} <span aria-hidden style={{ fontSize: "10px", marginLeft: "2px" }}>▾</span>
          </Link>
          <div className="nav-menu nav-menu-cols">
            <div>
              <span className="nav-menu-head">{t.nav.byType}</span>
              {categories.map((c) => (
                <Link key={c.slug} href={c.href}>{c.label}</Link>
              ))}
            </div>
            <div>
              <span className="nav-menu-head">{t.nav.byFuel}</span>
              {fuelLinks.map((f) => (
                <Link key={f.href} href={f.href}>{f.label}</Link>
              ))}
            </div>
          </div>
        </div>
        {navLinks.map((link) => (
          <Link key={link.href} href={href(link.href)} className="nav-link-hero" aria-current={here(link.section)}>
            {link.label}
          </Link>
        ))}
        <Link href={href("/outlet")} className="nav-link-hero" aria-current={here("outlet")}>
          {t.nav.outlet}
        </Link>
      </div>

      <div className="nav-end">
        <LanguageSwitcher />
        <div className="site-nav-actions">
          <Link href="/conta" className="nav-link-hero">
            {t.common.clientArea}
          </Link>
          <Link href={href("/pedir-orcamento")} className="btn-primary site-nav-cta">
            {t.common.requestQuote}
          </Link>
        </div>

        <details className="mobile-menu">
          <summary aria-label={t.nav.openMenu}>
            <span />
            <span />
            <span />
          </summary>
          <div className="mobile-menu-panel">
            <span className="nav-menu-head">{t.nav.products}</span>
            {categories.map((c) => (
              <Link key={c.slug} href={c.href}>{c.label}</Link>
            ))}
            <div className="mobile-menu-fuels">
              {fuelLinks.map((f) => (
                <Link key={f.href} href={f.href}>{f.label}</Link>
              ))}
            </div>
            <span className="nav-menu-head">Pachinha</span>
            {navLinks.map((link) => (
              <Link key={link.href} href={href(link.href)} aria-current={here(link.section)}>{link.label}</Link>
            ))}
            <Link href={href("/outlet")} aria-current={here("outlet")}>{t.nav.outlet}</Link>
            <Link href="/conta">{t.common.clientArea}</Link>
            <Link href={href("/pedir-orcamento")} className="btn-primary mobile-menu-cta">{t.common.requestQuote}</Link>
          </div>
        </details>
      </div>
    </nav>
  );
}
