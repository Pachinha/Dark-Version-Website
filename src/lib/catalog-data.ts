import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import type { Fuel } from "@/lib/catalog";

// Catálogo lido da base de dados (supabase/014_catalogo.sql), já na língua da página.
// Textos traduzidos ficam em `translations[locale][campo]`; em falta, vale o português.

type Translations = Partial<Record<Locale, Record<string, string>>>;

export type BrandRow = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  description: string;
  website: string;
  logo_url: string;
  logo_height: number;
  imported: boolean;
  in_ticker: boolean;
  active: boolean;
  sort: number;
  translations: Translations;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort: number;
  translations: Translations;
};

export type ProductRow = {
  id: string;
  slug: string;
  brand_id: string;
  category_id: string;
  name: string;
  fuel: Fuel;
  description: string;
  power_kw: number | null;
  heated_area_m2: number | null;
  efficiency_pct: number | null;
  energy_class: string;
  dimensions: string;
  badge: string;
  outlet: boolean;
  photos: string[];
  active: boolean;
  sort: number;
  translations: Translations;
};

export const BRAND_COLUMNS = "id, slug, name, origin, description, website, logo_url, logo_height, imported, in_ticker, active, sort, translations";
export const CATEGORY_COLUMNS = "id, slug, name, title, subtitle, image_url, active, sort, translations";
export const PRODUCT_COLUMNS =
  "id, slug, brand_id, category_id, name, fuel, description, power_kw, heated_area_m2, efficiency_pct, energy_class, dimensions, badge, outlet, photos, active, sort, translations";

// Texto de um campo na língua pedida, com o português como reserva.
export function tr<T extends { translations: Translations }>(row: T, field: keyof T & string, locale: Locale): string {
  const value = row.translations?.[locale]?.[field];
  return value?.trim() ? value : String(row[field] ?? "");
}

export type Brand = {
  slug: string;
  name: string;
  origin: string;
  description: string;
  website: string;
  logo: string;
  logoHeight: number;
  imported: boolean;
  inTicker: boolean;
};

export type Category = { slug: string; name: string; title: string; subtitle: string; image: string; href: string };

export type Product = {
  slug: string;
  name: string;
  brand: Brand;
  category: Category;
  fuel: Fuel;
  description: string;
  powerKw: number | null;
  heatedArea: number | null;
  efficiency: number | null;
  energyClass: string;
  dimensions: string;
  badge: string; // "" | novidade | exposicao | ultima_unidade
  outlet: boolean;
  photos: string[];
  href: string;
};

const toBrand = (b: BrandRow, l: Locale): Brand => ({
  slug: b.slug,
  name: b.name,
  origin: tr(b, "origin", l),
  description: tr(b, "description", l),
  website: b.website,
  logo: b.logo_url,
  logoHeight: b.logo_height,
  imported: b.imported,
  inTicker: b.in_ticker,
});

const toCategory = (c: CategoryRow, l: Locale): Category => ({
  slug: c.slug,
  name: tr(c, "name", l),
  title: tr(c, "title", l),
  subtitle: tr(c, "subtitle", l),
  image: c.image_url,
  href: `/produtos/${c.slug}`,
});

// Tudo o que está visível, uma vez por pedido. (Mesmo com sessão de administrador,
// o site só mostra o que está visível — o painel é que mostra os escondidos.)
const loadVisible = cache(async () => {
  const supabase = await createClient();
  const [brands, categories, products] = await Promise.all([
    supabase.from("catalog_brands").select(BRAND_COLUMNS).eq("active", true).order("sort").order("name"),
    supabase.from("catalog_categories").select(CATEGORY_COLUMNS).eq("active", true).order("sort").order("name"),
    supabase.from("catalog_products").select(PRODUCT_COLUMNS).eq("active", true).order("sort").order("name"),
  ]);
  if (brands.error || categories.error || products.error) {
    console.error("[catálogo]", brands.error?.message ?? categories.error?.message ?? products.error?.message);
  }
  return {
    brands: (brands.data ?? []) as BrandRow[],
    categories: (categories.data ?? []) as CategoryRow[],
    products: (products.data ?? []) as ProductRow[],
  };
});

export const getCatalog = cache(async (locale: Locale) => {
  const raw = await loadVisible();
  const brandById = new Map(raw.brands.map((b) => [b.id, toBrand(b, locale)]));
  const categoryById = new Map(raw.categories.map((c) => [c.id, toCategory(c, locale)]));
  // Produto de uma marca ou categoria escondida também fica escondido.
  const products: Product[] = raw.products.flatMap((p) => {
    const brand = brandById.get(p.brand_id);
    const category = categoryById.get(p.category_id);
    if (!brand || !category) return [];
    return [{
      slug: p.slug,
      name: tr(p, "name", locale),
      brand,
      category,
      fuel: p.fuel,
      description: tr(p, "description", locale),
      powerKw: p.power_kw,
      heatedArea: p.heated_area_m2,
      efficiency: p.efficiency_pct,
      energyClass: p.energy_class,
      dimensions: p.dimensions,
      badge: p.badge,
      outlet: p.outlet,
      photos: p.photos,
      href: `/produto/${p.slug}`,
    }];
  });
  return {
    brands: [...brandById.values()],
    categories: [...categoryById.values()],
    products,
  };
});
