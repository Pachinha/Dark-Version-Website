-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 015: sem catálogos em PDF
-- Decisão de 2026-11-04: o site mostra só os produtos que a Pachinha escolhe,
-- não os catálogos completos das marcas. Retira os campos do catálogo em PDF
-- e o bucket "catalog" passa a aceitar só imagens (fotos e logótipos).
-- Pré-requisito: 014_catalogo.sql
-- ════════════════════════════════════════════════════════════════════
alter table public.catalog_brands drop column catalog_url, drop column catalog_label;

update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
       file_size_limit = 4194304
 where id = 'catalog';
