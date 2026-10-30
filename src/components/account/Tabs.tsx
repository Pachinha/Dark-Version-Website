"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Tabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // The most specific matching tab is the active one.
  const active = items
    .filter((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="tabs" aria-label="Secções">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`tab${t.href === active ? " tab-active" : ""}`}
          aria-current={t.href === active ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
