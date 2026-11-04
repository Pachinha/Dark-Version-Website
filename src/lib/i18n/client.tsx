"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, localizePath, type Locale } from "./config";
import type { ClientDict } from "./dict/types";

// Os componentes interativos (cookies, formulário de orçamento…) recebem só a parte
// do dicionário de que precisam, passada pelo layout.
const I18nContext = createContext<{ locale: Locale; t: ClientDict } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: ClientDict; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n fora do I18nProvider");
  const { locale, t } = ctx;
  return { locale, t, href: (path: string) => localizePath(locale ?? DEFAULT_LOCALE, path) };
}
