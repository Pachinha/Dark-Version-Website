import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale, localizePath, type Locale } from "./config";
import { DICTIONARIES } from "./dict";
import type { Dict } from "./dict/types";

// Língua do pedido atual (posta pelo proxy). Sem cabeçalho → português.
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Textos da página na língua do pedido, e `href` para manter os links nessa língua.
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: DICTIONARIES[locale], href: (path: string) => localizePath(locale, path) };
}

// Título da página na língua do pedido: "Sobre nós — Lareiras Pachinha".
export async function pageMetadata(pick: (t: Dict) => string, extra: Metadata = {}): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${pick(t)} — ${t.meta.suffix}`, ...extra };
}
