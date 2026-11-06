-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 018: espaço ocupado (plano gratuito do Supabase)
--  • space_usage(): tamanho da base de dados e dos ficheiros (por bucket), para o painel
--  • space_alerts: último nível de aviso enviado (80/90/95%), para não repetir avisos
-- Só o servidor (chave secreta) usa estas duas coisas. Pré-requisito: 017
-- ════════════════════════════════════════════════════════════════════

create or replace function public.space_usage()
returns table (kind text, bucket text, bytes bigint, files bigint)
language sql stable security definer set search_path = ''
as $$
  select 'database', null::text, pg_database_size(current_database()), null::bigint
  union all
  select 'storage', o.bucket_id, coalesce(sum((o.metadata->>'size')::bigint), 0), count(*)
    from storage.objects o
   group by o.bucket_id;
$$;

revoke execute on function public.space_usage() from public, anon, authenticated;
grant execute on function public.space_usage() to service_role;

create table public.space_alerts (
  kind       text primary key check (kind in ('database', 'storage')),
  level      integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.space_alerts enable row level security;
-- Sem políticas: só a chave secreta do servidor lê e escreve.
insert into public.space_alerts (kind) values ('database'), ('storage');
