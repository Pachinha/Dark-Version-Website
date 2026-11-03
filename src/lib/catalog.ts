// Catálogo do site: tipos de equipamento, combustíveis e modelos.
// Organização inspirada nos sites que a Sandra enviou (Chamilar, Bigavac, Unichama, Ambinigma):
// por tipo e por combustível, cartões simples (foto, marca, modelo) e sem preços — o cliente pede orçamento.
// Os modelos abaixo são provisórios até chegarem os modelos e fotos reais (catálogo Philippe 2025/2026).

// As chaves coincidem com FUEL em lib/labels.ts, para pré-preencher o pedido de orçamento.
export const FUELS = {
  lenha: "Lenha",
  pellets: "Pellets",
  gas: "Gás",
  eletrico: "Elétricas",
  bioetanol: "Bioetanol",
  carvao: "Carvão",
} as const;
export type Fuel = keyof typeof FUELS;

// Ordem pedida pela Sandra: lenha, pellets, gás, elétricas e bioetanol.
export const MAIN_FUELS: Fuel[] = ["lenha", "pellets", "gas", "eletrico", "bioetanol"];

// "label" coincide com QUOTE_PRODUCTS em lib/labels.ts.
export const CATEGORIES = [
  { slug: "lareiras", label: "Lareiras", href: "/lareiras", img: "/images/orcamento/lareira.jpg", alt: "Lareira embutida com lume aceso" },
  { slug: "recuperadores", label: "Recuperadores", href: "/recuperadores", img: "/images/orcamento/recuperador.jpg", alt: "Recuperador a lenha instalado" },
  { slug: "salamandras", label: "Salamandras", href: "/salamandras", img: "/images/orcamento/salamandra.jpg", alt: "Salamandra a lenha" },
  { slug: "fogoes", label: "Fogões", href: "/fogoes", img: "/images/orcamento/fogao.jpg", alt: "Fogão a lenha de cozinha" },
  { slug: "churrasqueiras", label: "Churrasqueiras", href: "/churrasqueiras", img: "/images/orcamento/churrasqueira.jpg", alt: "Churrasqueira com brasas" },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export type Product = {
  category: CategorySlug;
  brand: string;
  name: string;
  fuel: Fuel;
  img: string;
  badge?: string;
};

export const PRODUCTS: Product[] = [
  { category: "lareiras", brand: "Cheminées Philippe", name: "Lareira metálica", fuel: "lenha", img: "/images/orcamento/lareira.jpg", badge: "Importador" },
  { category: "lareiras", brand: "Stûv", name: "Lareira dupla face", fuel: "lenha", img: "/images/orcamento/lareira.jpg" },
  { category: "lareiras", brand: "Focus", name: "Lareira suspensa", fuel: "lenha", img: "/images/orcamento/lareira.jpg" },
  { category: "lareiras", brand: "Bellfires", name: "Lareira a gás", fuel: "gas", img: "/images/orcamento/lareira.jpg" },
  { category: "lareiras", brand: "DRU", name: "Lareira elétrica", fuel: "eletrico", img: "/images/orcamento/lareira.jpg" },
  { category: "lareiras", brand: "M Design", name: "Lareira a bioetanol", fuel: "bioetanol", img: "/images/orcamento/lareira.jpg" },

  { category: "recuperadores", brand: "Cheminées Philippe", name: "Recuperador a lenha", fuel: "lenha", img: "/images/orcamento/recuperador.jpg", badge: "Importador" },
  { category: "recuperadores", brand: "Solzaima", name: "Recuperador a lenha", fuel: "lenha", img: "/images/orcamento/recuperador.jpg" },
  { category: "recuperadores", brand: "Hoxter", name: "Recuperador de porta de subir", fuel: "lenha", img: "/images/orcamento/recuperador.jpg" },
  { category: "recuperadores", brand: "Romotop", name: "Recuperador panorâmico", fuel: "lenha", img: "/images/orcamento/recuperador.jpg" },
  { category: "recuperadores", brand: "Lacunza", name: "Recuperador a lenha", fuel: "lenha", img: "/images/orcamento/recuperador.jpg" },
  { category: "recuperadores", brand: "Edilkamin", name: "Recuperador a pellets", fuel: "pellets", img: "/images/orcamento/recuperador.jpg" },

  { category: "salamandras", brand: "Godin", name: "Salamandra em ferro fundido", fuel: "lenha", img: "/images/orcamento/salamandra.jpg", badge: "Importador" },
  { category: "salamandras", brand: "Jøtul", name: "Salamandra a lenha", fuel: "lenha", img: "/images/orcamento/salamandra.jpg" },
  { category: "salamandras", brand: "Bronpi", name: "Salamandra a lenha", fuel: "lenha", img: "/images/orcamento/salamandra.jpg" },
  { category: "salamandras", brand: "MCZ", name: "Salamandra a pellets", fuel: "pellets", img: "/images/orcamento/salamandra.jpg" },
  { category: "salamandras", brand: "Ecoforest", name: "Salamandra a pellets", fuel: "pellets", img: "/images/orcamento/salamandra.jpg" },
  { category: "salamandras", brand: "Evacalor", name: "Salamandra a pellets", fuel: "pellets", img: "/images/orcamento/salamandra.jpg" },

  { category: "fogoes", brand: "Godin", name: "Fogão de cozinha a lenha", fuel: "lenha", img: "/images/orcamento/fogao.jpg", badge: "Importador" },
  { category: "fogoes", brand: "La Nordica", name: "Fogão de cozinha a lenha", fuel: "lenha", img: "/images/orcamento/fogao.jpg" },
  { category: "fogoes", brand: "Bronpi", name: "Fogão de cozinha a lenha", fuel: "lenha", img: "/images/orcamento/fogao.jpg" },

  { category: "churrasqueiras", brand: "Fogo Montanha", name: "Churrasqueira de alvenaria", fuel: "carvao", img: "/images/orcamento/churrasqueira.jpg" },
  { category: "churrasqueiras", brand: "Bronpi", name: "Churrasqueira pré-fabricada", fuel: "carvao", img: "/images/orcamento/churrasqueira.jpg" },
  { category: "churrasqueiras", brand: "Cozingas", name: "Grelhador a gás", fuel: "gas", img: "/images/orcamento/churrasqueira.jpg" },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const isFuel = (value: string | undefined): value is Fuel => !!value && value in FUELS;

// Pedido de orçamento já com o tipo (e o combustível, se fizer sentido) escolhidos.
export function quoteHref(category?: CategorySlug, fuel?: Fuel) {
  const params = new URLSearchParams();
  const cat = category && categoryBySlug(category);
  if (cat) params.set("tipo", cat.label);
  if (fuel && fuel !== "carvao") params.set("combustivel", fuel);
  const qs = params.toString();
  return `/pedir-orcamento${qs ? `?${qs}` : ""}`;
}
