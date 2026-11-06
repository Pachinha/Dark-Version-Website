// Línguas do site público. O português fica nos URLs de sempre (/sobre);
// as outras ganham prefixo (/en/sobre, /es/sobre…) — o proxy (src/proxy.ts) reescreve-os.
// A área de cliente, o login e o painel continuam só em português.

export const LOCALES = ["pt", "en", "es", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

// Escolha do visitante (dropdown). Só serve para não voltarmos a redirecionar pela língua do browser.
export const LOCALE_COOKIE = "pachinha_lang";
// Cabeçalho interno que o proxy passa às páginas com a língua do pedido.
export const LOCALE_HEADER = "x-pachinha-locale";

export const LOCALE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

// Valor para <html lang> e para formatar datas.
export const LOCALE_TAGS: Record<Locale, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" };

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

// Páginas traduzidas (o próprio caminho e tudo o que estiver por baixo).
const LOCALIZED = [
  "/sobre", "/obras", "/produtos", "/produto", "/lareiras", "/recuperadores", "/salamandras", "/fogoes", "/churrasqueiras",
  "/outlet", "/apoio-ao-cliente", "/pedir-orcamento", "/pedir-servico", "/pedido", "/privacidade", "/termos", "/cookies", "/manutencao",
];

export function isLocalizedPath(path: string) {
  const p = path.split(/[?#]/)[0] || "/";
  return p === "/" || LOCALIZED.some((l) => p === l || p.startsWith(`${l}/`));
}

// Rotas que só existem em português (área de cliente, login, ligações enviadas por email…).
// /en/conta redireciona para /conta; outros endereços desconhecidos mostram o 404 na língua pedida.
const PORTUGUESE_ONLY = ["/conta", "/entrar", "/registar", "/recuperar", "/auth", "/api", "/localizacao", "/orcamento"];

export function isPortugueseOnly(path: string, panelSlug?: string) {
  const roots = panelSlug ? [...PORTUGUESE_ONLY, `/${panelSlug}`] : PORTUGUESE_ONLY;
  return roots.some((r) => path === r || path.startsWith(`${r}/`));
}

// "/sobre" → "/en/sobre" (e "/" → "/en"). Caminhos não traduzidos e links externos ficam como estão.
export function localizePath(locale: Locale, href: string) {
  if (locale === DEFAULT_LOCALE || !href.startsWith("/") || !isLocalizedPath(href)) return href;
  return href === "/" ? `/${locale}` : href.startsWith("/?") || href.startsWith("/#") ? `/${locale}${href.slice(1)}` : `/${locale}${href}`;
}

// "/en/sobre" → { locale: "en", path: "/sobre" }
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const first = pathname.split("/")[1];
  if (isLocale(first) && first !== DEFAULT_LOCALE) return { locale: first, path: pathname.slice(first.length + 1) || "/" };
  return { locale: DEFAULT_LOCALE, path: pathname };
}

// Minúsculas a meio da frase ("Equipamentos a lenha"). Em alemão os substantivos levam sempre maiúscula.
export const midSentence = (locale: Locale, word: string) => (locale === "de" ? word : word.toLowerCase());

// 8.5 → "8,5" em português, "8.5" em inglês.
export const formatNumber = (locale: Locale, n: number) => new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 1 }).format(n);

// Substitui {chave} numa frase traduzida.
export function fmt(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
