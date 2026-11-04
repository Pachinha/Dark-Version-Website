-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 014: catálogo gerido no painel
-- Marcas, categorias e produtos passam a viver na base de dados: a administração
-- cria, edita, esconde e apaga no painel (separador "Catálogo") e o site lê daqui.
-- Os combustíveis continuam fixos no código (estão ligados ao pedido de orçamento).
--
-- Traduções: cada linha tem `translations` = {"en": {...}, "es": {...}, "fr": {...}, "de": {...}}
-- com os mesmos campos de texto da linha (name, description, title…). Campo em falta → português.
--
-- Leitura pública só do que está visível (active); escrita só da administração (is_admin()).
-- Fotos, logótipos e catálogos em PDF ficam no bucket público "catalog" (escrito só pelo servidor).
-- Pré-requisito: 013_pedido_localizacao.sql. Dados iniciais: 014_catalogo_dados.sql.
-- ════════════════════════════════════════════════════════════════════

create table public.catalog_brands (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null check (char_length(name) between 1 and 80),
  origin         text not null default '' check (char_length(origin) <= 60),
  description    text not null default '' check (char_length(description) <= 2000),
  website        text not null default '' check (char_length(website) <= 300),
  logo_url       text not null default '' check (char_length(logo_url) <= 500),
  logo_height    smallint not null default 30 check (logo_height between 10 and 60),
  imported       boolean not null default false,  -- "Importador oficial": destaque na página inicial
  in_ticker      boolean not null default true,   -- aparece na faixa de marcas
  catalog_url    text not null default '' check (char_length(catalog_url) <= 500),
  catalog_label  text not null default '' check (char_length(catalog_label) <= 40),
  active         boolean not null default true,
  sort           integer not null default 0,
  translations   jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.catalog_categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null check (char_length(name) between 1 and 60),
  title         text not null default '' check (char_length(title) <= 120),   -- frase do topo da página
  subtitle      text not null default '' check (char_length(subtitle) <= 300),
  image_url     text not null default '' check (char_length(image_url) <= 500),
  active        boolean not null default true,
  sort          integer not null default 0,
  translations  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.catalog_products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand_id        uuid not null references public.catalog_brands on delete restrict,
  category_id     uuid not null references public.catalog_categories on delete restrict,
  name            text not null check (char_length(name) between 1 and 120),
  fuel            text not null check (fuel in ('lenha', 'pellets', 'gas', 'eletrico', 'bioetanol', 'carvao')),
  description     text not null default '' check (char_length(description) <= 5000),
  power_kw        numeric(5, 1) check (power_kw > 0 and power_kw < 1000),
  heated_area_m2  integer check (heated_area_m2 between 1 and 5000),
  efficiency_pct  numeric(4, 1) check (efficiency_pct > 0 and efficiency_pct <= 110),
  energy_class    text not null default '' check (energy_class in ('', 'A+++', 'A++', 'A+', 'A', 'B', 'C', 'D')),
  dimensions      text not null default '' check (char_length(dimensions) <= 120),
  badge           text not null default '' check (badge in ('', 'novidade', 'exposicao', 'ultima_unidade')),
  outlet          boolean not null default false,
  photos          text[] not null default '{}' check (cardinality(photos) <= 12),
  active          boolean not null default true,
  sort            integer not null default 0,
  translations    jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.catalog_products (category_id);
create index on public.catalog_products (brand_id);

create trigger catalog_brands_touch before update on public.catalog_brands
  for each row execute function public.touch_updated_at();
create trigger catalog_categories_touch before update on public.catalog_categories
  for each row execute function public.touch_updated_at();
create trigger catalog_products_touch before update on public.catalog_products
  for each row execute function public.touch_updated_at();

-- ── Acessos ──
alter table public.catalog_brands enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_products enable row level security;

revoke all on public.catalog_brands, public.catalog_categories, public.catalog_products from anon, authenticated;
grant select on public.catalog_brands, public.catalog_categories, public.catalog_products to anon, authenticated;
grant insert, update, delete on public.catalog_brands, public.catalog_categories, public.catalog_products to authenticated;

-- O visitante anónimo não pode executar is_admin() (007), por isso tem uma política só sua.
create policy "catalogo: visitantes leem o que está visível" on public.catalog_brands
  for select to anon using (active);
create policy "catalogo: leitura (escondidos só a administração)" on public.catalog_brands
  for select to authenticated using (active or public.is_admin());
create policy "catalogo: visitantes leem o que está visível" on public.catalog_categories
  for select to anon using (active);
create policy "catalogo: leitura (escondidos só a administração)" on public.catalog_categories
  for select to authenticated using (active or public.is_admin());
create policy "catalogo: visitantes leem o que está visível" on public.catalog_products
  for select to anon using (active);
create policy "catalogo: leitura (escondidos só a administração)" on public.catalog_products
  for select to authenticated using (active or public.is_admin());

create policy "catalogo: administração cria" on public.catalog_brands for insert to authenticated with check (public.is_admin());
create policy "catalogo: administração altera" on public.catalog_brands for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalogo: administração apaga" on public.catalog_brands for delete to authenticated using (public.is_admin());
create policy "catalogo: administração cria" on public.catalog_categories for insert to authenticated with check (public.is_admin());
create policy "catalogo: administração altera" on public.catalog_categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalogo: administração apaga" on public.catalog_categories for delete to authenticated using (public.is_admin());
create policy "catalogo: administração cria" on public.catalog_products for insert to authenticated with check (public.is_admin());
create policy "catalogo: administração altera" on public.catalog_products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalogo: administração apaga" on public.catalog_products for delete to authenticated using (public.is_admin());

-- ── Ficheiros do catálogo (públicos: fotos, logótipos, PDFs) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
