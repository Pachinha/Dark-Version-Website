"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ENERGY_CLASSES, FUEL_KEYS, PRODUCT_BADGES, slugify } from "@/lib/catalog";
import { IMAGE_TYPES, removeCatalogFiles, uploadCatalogFile } from "@/lib/catalog-storage";
import { LOCALES } from "@/lib/i18n/config";
import { panel } from "@/lib/panel";
import { checkSpace } from "@/lib/space";
import type { FormState } from "./auth";

// Catálogo no painel (separador "Catálogo"): marcas, categorias e produtos.
// Sem catálogos em PDF: o site mostra só os produtos escolhidos pela Pachinha.
// Cada função começa por requireAdmin(): num ficheiro "use server" cada export é um endpoint público.
// As escritas usam a sessão da administração (RLS: is_admin()); os ficheiros vão pelo servidor.

const MAX_LOGO = 2 * 1024 * 1024;
const MAX_IMAGE = 4 * 1024 * 1024;
const MAX_PHOTOS = 12;

const text = (fd: FormData, key: string, max = 5000) => String(fd.get(key) ?? "").trim().slice(0, max);
const flag = (fd: FormData, key: string) => fd.get(key) === "on";
const file = (fd: FormData, key: string) => {
  const f = fd.get(key);
  return f instanceof File && f.size > 0 ? f : null;
};
function number(fd: FormData, key: string, { min, max, integer = false }: { min: number; max: number; integer?: boolean }) {
  const raw = text(fd, key).replace(",", ".");
  if (!raw) return { value: null as number | null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) return { error: true, value: null };
  return { value: n };
}

// Campos "tr.en.name", "tr.fr.description"… → { en: { name }, fr: { description } } (vazios fora).
function translations(fd: FormData, fields: string[]) {
  const out: Record<string, Record<string, string>> = {};
  for (const locale of LOCALES) {
    if (locale === "pt") continue;
    for (const field of fields) {
      const value = text(fd, `tr.${locale}.${field}`);
      if (value) (out[locale] ??= {})[field] = value;
    }
  }
  return out;
}

// Endereço (slug): o escrito à mão ou, se vazio, gerado a partir do nome.
function slugFrom(fd: FormData, fallback: string) {
  const typed = slugify(text(fd, "slug", 120));
  return typed || slugify(fallback);
}

const DUPLICATE = "23505";
// Depois de gravar ou apagar: atualiza o site e confirma o espaço ocupado (lib/space.ts).
const refresh = () => {
  revalidatePath("/", "layout");
  after(checkSpace);
};

function dbError(error: { code?: string; message: string }, what: string): FormState {
  if (error.code === DUPLICATE) return { error: `Já existe ${what} com esse endereço (slug). Mude o nome ou o endereço.` };
  if (error.code === "23503") return { error: `Não é possível: ainda há produtos associados a ${what === "uma marca" ? "esta marca" : "esta categoria"}.` };
  console.error("[catálogo]", error.message);
  return { error: "Não foi possível gravar. Tente novamente." };
}

// ════════════════════════════ Produtos ════════════════════════════

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(fd, "id");
  const name = text(fd, "name", 120);
  const brandId = text(fd, "brand_id");
  const categoryId = text(fd, "category_id");
  const fuel = text(fd, "fuel");
  const badge = text(fd, "badge");
  const energyClass = text(fd, "energy_class");
  const power = number(fd, "power_kw", { min: 0.1, max: 999 });
  const area = number(fd, "heated_area_m2", { min: 1, max: 5000, integer: true });
  const efficiency = number(fd, "efficiency_pct", { min: 1, max: 110 });
  const sort = number(fd, "sort", { min: -100000, max: 100000, integer: true });

  if (name.length < 1) return { error: "Indique o nome do produto." };
  if (!brandId) return { error: "Escolha a marca." };
  if (!categoryId) return { error: "Escolha a categoria." };
  if (!FUEL_KEYS.includes(fuel as (typeof FUEL_KEYS)[number])) return { error: "Escolha o combustível." };
  if (badge && !PRODUCT_BADGES.includes(badge as (typeof PRODUCT_BADGES)[number])) return { error: "Etiqueta inválida." };
  if (energyClass && !ENERGY_CLASSES.includes(energyClass as (typeof ENERGY_CLASSES)[number])) return { error: "Classe energética inválida." };
  if (power.error) return { error: "A potência deve ser um número em kW (ex.: 8,5)." };
  if (area.error) return { error: "A área deve ser um número inteiro de m² (ex.: 90)." };
  if (efficiency.error) return { error: "O rendimento deve ser uma percentagem (ex.: 82)." };
  if (sort.error) return { error: "A ordem deve ser um número inteiro." };

  const { data: brand } = await supabase.from("catalog_brands").select("name").eq("id", brandId).maybeSingle();
  if (!brand) return { error: "A marca escolhida já não existe." };

  // Fotos: a ordem final vem em "photo_order" ("old:<url>" ou "new:<n>"); as novas em "new_photos".
  const { data: before } = id
    ? await supabase.from("catalog_products").select("photos").eq("id", id).maybeSingle<{ photos: string[] }>()
    : { data: null };
  if (id && !before) return { error: "Este produto já não existe." };
  const newFiles = fd.getAll("new_photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of newFiles) {
    if (!IMAGE_TYPES.includes(f.type)) return { error: "As fotos têm de ser JPG, PNG ou WebP." };
    if (f.size > MAX_IMAGE) return { error: "Uma das fotos é demasiado grande (máx. 4 MB)." };
  }
  const order = fd.getAll("photo_order").map(String);
  if (order.length > MAX_PHOTOS) return { error: `No máximo ${MAX_PHOTOS} fotos por produto.` };

  const uploaded: string[] = [];
  const photos: string[] = [];
  try {
    for (const entry of order) {
      if (entry.startsWith("old:")) {
        const url = entry.slice(4);
        if (before?.photos.includes(url)) photos.push(url); // só fotos que já eram deste produto
      } else if (entry.startsWith("new:")) {
        const f = newFiles[Number(entry.slice(4))];
        if (!f) continue;
        const url = await uploadCatalogFile(f, "produtos");
        uploaded.push(url);
        photos.push(url);
      }
    }
  } catch (e) {
    await removeCatalogFiles(uploaded);
    console.error("[catálogo] fotos", (e as Error).message);
    return { error: "Não foi possível enviar as fotos. Tente novamente." };
  }

  const row = {
    slug: slugFrom(fd, `${brand.name} ${name}`),
    name,
    brand_id: brandId,
    category_id: categoryId,
    fuel,
    description: text(fd, "description", 5000),
    power_kw: power.value,
    heated_area_m2: area.value,
    efficiency_pct: efficiency.value,
    energy_class: energyClass,
    dimensions: text(fd, "dimensions", 120),
    badge,
    outlet: flag(fd, "outlet"),
    active: flag(fd, "active"),
    sort: sort.value ?? 0,
    photos,
    translations: translations(fd, ["name", "description"]),
  };

  const { data: saved, error } = id
    ? await supabase.from("catalog_products").update(row).eq("id", id).select("id").single()
    : await supabase.from("catalog_products").insert(row).select("id").single();
  if (error || !saved) {
    await removeCatalogFiles(uploaded);
    return error ? dbError(error, "um produto") : { error: "Não foi possível gravar." };
  }
  // Fotos retiradas: apagar do armazenamento.
  await removeCatalogFiles((before?.photos ?? []).filter((url) => !photos.includes(url)));

  refresh();
  if (!id) redirect(panel(`/catalogo/produtos/${saved.id}?criado=1`));
  return { success: "Produto guardado." };
}

export async function deleteProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(fd, "id");
  const { data: product } = await supabase.from("catalog_products").select("photos").eq("id", id).maybeSingle<{ photos: string[] }>();
  if (!product) return { error: "Este produto já não existe." };
  const { error } = await supabase.from("catalog_products").delete().eq("id", id);
  if (error) return dbError(error, "um produto");
  await removeCatalogFiles(product.photos);
  refresh();
  redirect(panel("/catalogo?apagado=1"));
}

// Mostrar / esconder no site, direto da lista.
export async function toggleProduct(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("catalog_products").update({ active: fd.get("active") === "1" }).eq("id", text(fd, "id"));
  refresh();
}

// ════════════════════════════ Marcas ════════════════════════════

export async function saveBrand(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(fd, "id");
  const name = text(fd, "name", 80);
  const logoHeight = number(fd, "logo_height", { min: 10, max: 60, integer: true });
  const sort = number(fd, "sort", { min: -100000, max: 100000, integer: true });
  const website = text(fd, "website", 300);
  if (!name) return { error: "Indique o nome da marca." };
  if (logoHeight.error) return { error: "A altura do logótipo deve estar entre 10 e 60 px." };
  if (sort.error) return { error: "A ordem deve ser um número inteiro." };
  if (website && !/^https?:\/\/\S+$/.test(website)) return { error: "O site da marca deve começar por https://" };

  const { data: before } = id
    ? await supabase.from("catalog_brands").select("logo_url").eq("id", id).maybeSingle<{ logo_url: string }>()
    : { data: null };
  if (id && !before) return { error: "Esta marca já não existe." };

  const logo = file(fd, "logo");
  if (logo && (!IMAGE_TYPES.includes(logo.type) || logo.size > MAX_LOGO)) return { error: "O logótipo tem de ser PNG, JPG ou WebP, até 2 MB." };

  let logoUrl = flag(fd, "remove_logo") ? "" : (before?.logo_url ?? "");
  const uploaded: string[] = [];
  try {
    if (logo) uploaded.push((logoUrl = await uploadCatalogFile(logo, "marcas")));
  } catch (e) {
    await removeCatalogFiles(uploaded);
    console.error("[catálogo] ficheiros da marca", (e as Error).message);
    return { error: "Não foi possível enviar o ficheiro. Tente novamente." };
  }

  const row = {
    slug: slugFrom(fd, name),
    name,
    origin: text(fd, "origin", 60),
    description: text(fd, "description", 2000),
    website,
    logo_url: logoUrl,
    logo_height: logoHeight.value ?? 30,
    imported: flag(fd, "imported"),
    in_ticker: flag(fd, "in_ticker"),
    active: flag(fd, "active"),
    sort: sort.value ?? 0,
    translations: translations(fd, ["origin", "description"]),
  };
  const { data: saved, error } = id
    ? await supabase.from("catalog_brands").update(row).eq("id", id).select("id").single()
    : await supabase.from("catalog_brands").insert(row).select("id").single();
  if (error || !saved) {
    await removeCatalogFiles(uploaded);
    return error ? dbError(error, "uma marca") : { error: "Não foi possível gravar." };
  }
  if (before && before.logo_url !== logoUrl) await removeCatalogFiles([before.logo_url]);

  refresh();
  if (!id) redirect(panel(`/catalogo/marcas/${saved.id}?criado=1`));
  return { success: "Marca guardada." };
}

export async function deleteBrand(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(fd, "id");
  const { count } = await supabase.from("catalog_products").select("id", { count: "exact", head: true }).eq("brand_id", id);
  if (count) return { error: `Esta marca ainda tem ${count} produto${count > 1 ? "s" : ""}. Apague-os ou mude-os de marca primeiro — ou esconda a marca em vez de a apagar.` };
  const { data: brand } = await supabase.from("catalog_brands").select("logo_url").eq("id", id).maybeSingle<{ logo_url: string }>();
  if (!brand) return { error: "Esta marca já não existe." };
  const { error } = await supabase.from("catalog_brands").delete().eq("id", id);
  if (error) return dbError(error, "uma marca");
  await removeCatalogFiles([brand.logo_url]);
  refresh();
  redirect(panel("/catalogo/marcas?apagado=1"));
}

// ════════════════════════════ Categorias ════════════════════════════

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(fd, "id");
  const name = text(fd, "name", 60);
  const sort = number(fd, "sort", { min: -100000, max: 100000, integer: true });
  if (!name) return { error: "Indique o nome da categoria." };
  if (sort.error) return { error: "A ordem deve ser um número inteiro." };

  const { data: before } = id
    ? await supabase.from("catalog_categories").select("image_url").eq("id", id).maybeSingle<{ image_url: string }>()
    : { data: null };
  if (id && !before) return { error: "Esta categoria já não existe." };

  const image = file(fd, "image");
  if (image && (!IMAGE_TYPES.includes(image.type) || image.size > MAX_IMAGE)) return { error: "A imagem tem de ser JPG, PNG ou WebP, até 4 MB." };
  let imageUrl = flag(fd, "remove_image") ? "" : (before?.image_url ?? "");
  let uploaded = "";
  try {
    if (image) uploaded = imageUrl = await uploadCatalogFile(image, "categorias");
  } catch (e) {
    console.error("[catálogo] imagem da categoria", (e as Error).message);
    return { error: "Não foi possível enviar a imagem. Tente novamente." };
  }

  const row = {
    slug: slugFrom(fd, name),
    name,
    title: text(fd, "title", 120),
    subtitle: text(fd, "subtitle", 300),
    image_url: imageUrl,
    active: flag(fd, "active"),
    sort: sort.value ?? 0,
    translations: translations(fd, ["name", "title", "subtitle"]),
  };
  const { data: saved, error } = id
    ? await supabase.from("catalog_categories").update(row).eq("id", id).select("id").single()
    : await supabase.from("catalog_categories").insert(row).select("id").single();
  if (error || !saved) {
    await removeCatalogFiles([uploaded]);
    return error ? dbError(error, "uma categoria") : { error: "Não foi possível gravar." };
  }
  if (before && before.image_url !== imageUrl) await removeCatalogFiles([before.image_url]);

  refresh();
  if (!id) redirect(panel(`/catalogo/categorias/${saved.id}?criado=1`));
  return { success: "Categoria guardada." };
}

export async function deleteCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(fd, "id");
  const { count } = await supabase.from("catalog_products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return { error: `Esta categoria ainda tem ${count} produto${count > 1 ? "s" : ""}. Mude-os de categoria ou apague-os primeiro — ou esconda a categoria em vez de a apagar.` };
  const { data: category } = await supabase.from("catalog_categories").select("image_url").eq("id", id).maybeSingle<{ image_url: string }>();
  if (!category) return { error: "Esta categoria já não existe." };
  const { error } = await supabase.from("catalog_categories").delete().eq("id", id);
  if (error) return dbError(error, "uma categoria");
  await removeCatalogFiles([category.image_url]);
  refresh();
  redirect(panel("/catalogo/categorias?apagado=1"));
}
