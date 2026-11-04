"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

// Ícones de traço (24×24), no mesmo estilo dos do site.
const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  quote: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />,
  job: <><path d="M2 20h20M5 20V9l7-5 7 5v11" /><path d="M10 20v-6h4v6" /></>,
  clients: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  product: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
  brand: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  category: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  team: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  account: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.2 18.6a7 7 0 0 1 11.6 0" /></>,
  site: <><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
};

const Icon = ({ name }: { name: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {ICONS[name]}
  </svg>
);

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title?: string; items: NavItem[] };

// Navegação do painel: barra lateral no computador, menu que abre por cima no telemóvel.
export default function PanelNav({
  home,
  groups,
  footer,
  newEntry,
  user,
  logoutNext,
}: {
  home: string;
  groups: NavGroup[];
  footer: NavItem[];
  newEntry?: string; // "+ Novo" (só administração)
  user: { name: string; role: string };
  logoutNext: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const all = [...groups.flatMap((g) => g.items), ...footer];
  // O item mais específico que corresponde ao endereço é o ativo.
  const active = all
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const close = () => setOpen(false);

  const link = (i: NavItem) => (
    <Link
      key={i.href}
      href={i.href}
      className={`admin-link${i.href === active ? " admin-link-active" : ""}`}
      aria-current={i.href === active ? "page" : undefined}
      onClick={close}
    >
      <Icon name={i.icon} />
      {i.label}
    </Link>
  );

  return (
    <aside className="admin-side no-print" data-open={open || undefined}>
      <div className="admin-top">
        <Link href={home} className="admin-logo" onClick={close}>
          <img src="/images/logo.png" alt="Lareiras Pachinha — início do painel" />
        </Link>
        <button type="button" className="admin-menu-btn" aria-expanded={open} aria-controls="admin-drawer" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="admin-drawer" id="admin-drawer">
        {newEntry && (
          <Link href={newEntry} className="btn btn-fire admin-new" onClick={close}>
            + Novo registo
          </Link>
        )}

        <nav aria-label="Painel" className="admin-groups">
          {groups.map((g) => (
            <div key={g.title ?? "geral"} className="admin-group">
              {g.title && <span className="admin-group-title">{g.title}</span>}
              {g.items.map(link)}
            </div>
          ))}
        </nav>

        <div className="admin-user">
          <div className="admin-user-name">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          {footer.map(link)}
          <a href="/" target="_blank" rel="noreferrer" className="admin-link">
            <Icon name="site" />
            Ver o site
          </a>
          <form action={logout}>
            <input type="hidden" name="next" value={logoutNext} />
            <button className="admin-link admin-logout">Terminar sessão</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
