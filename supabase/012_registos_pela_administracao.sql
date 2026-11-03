-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 012: a administração regista tudo sozinha no painel
--  • limpezas/manutenções e obras também para clientes SEM conta (quem aparece na loja
--    ou liga): nome, contactos e morada verificada ficam no próprio registo
--  • visitas de orçamento podem ter técnico atribuído (aparece-lhe na agenda)
-- As inserções são feitas pelo servidor depois de confirmar que é administrador (2FA).
-- Pré-requisito: 011_folha_campos_papel.sql
-- ════════════════════════════════════════════════════════════════════

-- ── Limpezas / manutenções sem conta ────────────────────────────────
alter table public.maintenance_requests alter column user_id drop not null;
alter table public.maintenance_requests
  add column name            text not null default '' check (char_length(name) <= 120),
  add column email           text not null default '' check (char_length(email) <= 200),
  add column phone           text not null default '' check (char_length(phone) <= 40),
  add column address         text not null default '' check (char_length(address) <= 300),
  add column address_details text not null default '' check (char_length(address_details) <= 200),
  add column lat             double precision check (lat between 32.3 and 42.2),
  add column lng             double precision check (lng between -31.5 and -6.1),
  add column created_by      uuid references public.profiles on delete set null,
  add constraint maintenance_client_check check (user_id is not null or char_length(name) > 0),
  add constraint maintenance_coords_check check ((lat is null) = (lng is null));

-- ── Obras sem conta e sem pedido de orçamento ───────────────────────
alter table public.jobs
  add column name            text not null default '' check (char_length(name) <= 120),
  add column email           text not null default '' check (char_length(email) <= 200),
  add column phone           text not null default '' check (char_length(phone) <= 40),
  add column address         text not null default '' check (char_length(address) <= 300),
  add column address_details text not null default '' check (char_length(address_details) <= 200),
  add column lat             double precision check (lat between 32.3 and 42.2),
  add column lng             double precision check (lng between -31.5 and -6.1),
  add constraint jobs_coords_check check ((lat is null) = (lng is null));
alter table public.jobs drop constraint jobs_client_check;
alter table public.jobs add constraint jobs_client_check
  check (user_id is not null or quote_id is not null or char_length(name) > 0);

-- ── Técnico nas visitas de orçamento ────────────────────────────────
alter table public.quote_requests add column technician_id uuid references public.profiles on delete set null;
create index on public.quote_requests (technician_id);
grant update (technician_id) on public.quote_requests to authenticated;

-- O técnico vê o pedido (e a folha) se tiver a visita atribuída ou a obra que dele resultou.
create or replace function public.is_assigned_quote(quote uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_technician_session() and (
       exists (select 1 from public.quote_requests q where q.id = quote and q.technician_id = auth.uid())
    or exists (select 1 from public.jobs j where j.quote_id = quote and j.technician_id = auth.uid()));
$$;

-- ── Pedidos registados pela equipa ──────────────────────────────────
-- Um pedido sem conta feito no site traz nome, telefone e a aceitação da política de
-- privacidade. Um pedido registado pela administração (cliente na loja / ao telefone)
-- fica identificado por created_by e precisa de nome e de um contacto (telefone ou email).
alter table public.quote_requests add column created_by uuid references public.profiles on delete set null;
alter table public.quote_requests drop constraint quote_requests_contact_check;
alter table public.quote_requests add constraint quote_requests_contact_check check (
  user_id is not null
  or (char_length(name) >= 2 and char_length(phone) >= 9 and privacy_version is not null)
  or (created_by is not null and char_length(name) >= 2 and (char_length(phone) >= 9 or char_length(email) >= 5))
);
