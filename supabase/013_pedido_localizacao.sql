-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 013: pedir a localização ao cliente
-- A administração envia ao cliente (WhatsApp/email) um link privado; o cliente abre-o,
-- partilha a localização (ou pesquisa a morada) e ela fica gravada no pedido de orçamento,
-- limpeza/manutenção ou obra. O link expira e só serve uma vez.
-- Lido e escrito só pelo servidor (chave secreta) depois de validar o administrador ou o token.
-- Pré-requisito: 012_registos_pela_administracao.sql
-- ════════════════════════════════════════════════════════════════════
create table public.location_requests (
  id            uuid primary key default gen_random_uuid(),
  token         uuid not null unique default gen_random_uuid(),
  entity        text not null check (entity in ('quote_requests', 'maintenance_requests', 'jobs')),
  entity_id     uuid not null,
  created_by    uuid references public.profiles on delete set null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '14 days',
  fulfilled_at  timestamptz,
  address       text not null default '' check (char_length(address) <= 300),
  lat           double precision check (lat between 32.3 and 42.2),
  lng           double precision check (lng between -31.5 and -6.1),
  source        text check (source in ('gps', 'search'))
);
create index on public.location_requests (entity, entity_id);

-- Sem acesso direto pela API: tudo passa pelo servidor.
revoke all on public.location_requests from anon, authenticated;
alter table public.location_requests enable row level security;
