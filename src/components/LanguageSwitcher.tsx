"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, localizePath, splitLocale, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

// Bandeiras redondas com as cores oficiais (o inglês usa a do Reino Unido).
// Desenhadas num quadrado 30×30 e recortadas em círculo pelo CSS (.lang-flag).
function Flag({ locale }: { locale: Locale }) {
  const id = useId();
  const svg = (children: React.ReactNode, viewBox = "0 0 30 30") => (
    <svg className="lang-flag" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      {children}
    </svg>
  );
  switch (locale) {
    case "pt":
      return svg(
        <>
          <rect width="12" height="30" fill="#046A38" />
          <rect x="12" width="18" height="30" fill="#DA291C" />
          <circle cx="12" cy="15" r="5.2" fill="none" stroke="#FFE900" strokeWidth="1.6" />
          <path d="M9.6 12.2h4.8v3.6c0 1.6-1.1 2.6-2.4 3-1.3-.4-2.4-1.4-2.4-3z" fill="#fff" />
          <path d="M10.4 13h3.2v2.8c0 1-.7 1.7-1.6 2-.9-.3-1.6-1-1.6-2z" fill="#DA291C" />
        </>,
      );
    case "en":
      return svg(
        <>
          <clipPath id={`${id}t`}>
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}t)`} stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </>,
        "15 0 30 30",
      );
    case "es":
      return svg(
        <>
          <rect width="30" height="30" fill="#AA151B" />
          <rect y="7.5" width="30" height="15" fill="#F1BF00" />
        </>,
      );
    case "fr":
      return svg(
        <>
          <rect width="10" height="30" fill="#002654" />
          <rect x="10" width="10" height="30" fill="#fff" />
          <rect x="20" width="10" height="30" fill="#CE1126" />
        </>,
      );
    case "de":
      return svg(
        <>
          <rect width="30" height="10" fill="#000" />
          <rect y="10" width="30" height="10" fill="#DD0000" />
          <rect y="20" width="30" height="10" fill="#FFCE00" />
        </>,
      );
  }
}

// Lembra a escolha (o proxy deixa de redirecionar pela língua do browser).
function rememberLocale(locale: Locale) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
}

// Mesma página noutra língua: /en/sobre?x=1 → /fr/sobre?x=1
function targetUrl(locale: Locale) {
  const { path } = splitLocale(window.location.pathname);
  return localizePath(locale, path) + window.location.search + window.location.hash;
}

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  // Fechar ao clicar fora ou com Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    rememberLocale(next);
    // Navegação completa: o layout (html lang, textos dos componentes interativos) muda de língua.
    if (next !== locale) window.location.assign(targetUrl(next));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = items.current.findIndex((el) => el === document.activeElement);
    if (e.key === "Escape") {
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>(".lang-button")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      const next = i === -1 ? LOCALES.indexOf(locale) : (i + step + LOCALES.length) % LOCALES.length;
      requestAnimationFrame(() => items.current[next]?.focus());
    }
  }

  return (
    <div className={`lang${open ? " lang-open" : ""}`} ref={root} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="lang-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${t.lang.choose} — ${LOCALE_NAMES[locale]}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Flag locale={locale} />
        <span className="lang-code">{locale.toUpperCase()}</span>
        <svg className="lang-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="lang-menu" id={menuId} role="menu" aria-label={t.lang.label}>
        {LOCALES.map((l, i) => (
          <button
            key={l}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={l === locale}
            lang={l}
            tabIndex={open ? 0 : -1}
            className={`lang-item${l === locale ? " lang-item-active" : ""}`}
            onClick={() => choose(l)}
          >
            <Flag locale={l} />
            <span className="lang-name">{LOCALE_NAMES[l]}</span>
            <span className="lang-item-code">{l.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
