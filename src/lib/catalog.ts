// Constantes do catálogo que continuam no código. Marcas, categorias e produtos
// vivem na base de dados (supabase/014_catalogo.sql) e lêem-se com lib/catalog-data.ts.

// Combustíveis: fixos, porque estão ligados ao pedido de orçamento (FUEL em lib/labels.ts).
export const FUELS = {
  lenha: "Lenha",
  pellets: "Pellets",
  gas: "Gás",
  eletrico: "Elétricas",
  bioetanol: "Bioetanol",
  carvao: "Carvão",
} as const;
export type Fuel = keyof typeof FUELS;
export const FUEL_KEYS = Object.keys(FUELS) as Fuel[];

// Ordem pedida pela Sandra: lenha, pellets, gás, elétricas e bioetanol.
export const MAIN_FUELS: Fuel[] = ["lenha", "pellets", "gas", "eletrico", "bioetanol"];

export const isFuel = (value: string | undefined | null): value is Fuel => !!value && value in FUELS;

// Tipos de equipamento do pedido de orçamento (gravados assim nos pedidos — não mudar).
// As categorias do catálogo com o mesmo slug pré-preenchem o pedido.
export const QUOTE_CATEGORY_BY_SLUG: Record<string, string> = {
  lareiras: "Lareiras",
  recuperadores: "Recuperadores",
  salamandras: "Salamandras",
  fogoes: "Fogões",
  churrasqueiras: "Churrasqueiras",
};
export const QUOTE_CATEGORIES = Object.values(QUOTE_CATEGORY_BY_SLUG);

// Pedido de orçamento já com o tipo e o combustível escolhidos (páginas de categoria).
export function quoteHref(categorySlug?: string, fuel?: Fuel) {
  const params = new URLSearchParams();
  const type = categorySlug && QUOTE_CATEGORY_BY_SLUG[categorySlug];
  if (type) params.set("tipo", type);
  if (fuel && fuel !== "carvao") params.set("combustivel", fuel);
  const qs = params.toString();
  return `/pedir-orcamento${qs ? `?${qs}` : ""}`;
}

// Pedido de orçamento de um modelo concreto: o formulário abre já com esse equipamento.
export const productQuoteHref = (productSlug: string) => `/pedir-orcamento?produto=${encodeURIComponent(productSlug)}`;

// Etiquetas que a administração pode pôr num produto ("Importador" vem da marca).
export const PRODUCT_BADGES = ["novidade", "exposicao", "ultima_unidade"] as const;
export const ENERGY_CLASSES = ["A+++", "A++", "A+", "A", "B", "C", "D"] as const;

// "Lareira Kivo 120" → "lareira-kivo-120"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ø/g, "o")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
