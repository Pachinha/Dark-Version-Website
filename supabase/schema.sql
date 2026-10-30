-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — esquema da base de dados (Supabase / Postgres)
-- Executar uma vez no Supabase: Dashboard → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════════

-- ── Perfis (1 por utilizador do Supabase Auth) ──────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users on delete cascade,
  email                 text not null default '',
  full_name             text not null default '',
  phone                 text not null default '',
  role                  text not null default 'client' check (role in ('client', 'admin')),
  privacy_version       text not null,
  privacy_accepted_at   timestamptz not null default now(),
  marketing_opt_in      boolean not null default false,
  marketing_updated_at  timestamptz,
  created_at            timestamptz not null default now()
);

-- Registo de consentimentos (prova de consentimento — art. 7.º RGPD)
create table public.consent_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles on delete cascade,
  kind        text not null check (kind in ('privacy', 'terms', 'marketing')),
  version     text,
  granted     boolean not null,
  created_at  timestamptz not null default now()
);

-- Moradas — só são aceites coordenadas dentro de Portugal (continente + ilhas)
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles on delete cascade,
  label       text not null default 'Casa',
  address     text not null,          -- morada formatada devolvida pela pesquisa
  details     text not null default '', -- nº de porta, andar, indicações
  postcode    text not null default '',
  locality    text not null default '',
  lat         double precision not null check (lat between 32.3 and 42.2),
  lng         double precision not null check (lng between -31.5 and -6.1),
  source      text not null check (source in ('gps', 'search')),
  created_at  timestamptz not null default now()
);

create table public.quote_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  category     text not null,
  message      text not null check (char_length(message) between 10 and 4000),
  status       text not null default 'novo' check (status in ('novo', 'em_analise', 'respondido', 'fechado')),
  admin_reply  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.maintenance_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles on delete cascade,
  address_id      uuid references public.addresses on delete set null,
  service         text not null check (service in ('manutencao', 'limpeza', 'assistencia')),
  equipment       text not null,
  preferred_date  date,
  notes           text not null default '',
  status          text not null default 'pendente' check (status in ('pendente', 'agendado', 'concluido', 'cancelado')),
  scheduled_for   timestamptz,
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  description  text not null,
  status       text not null default 'encomendado' check (status in ('encomendado', 'instalado', 'concluido')),
  order_date   date not null default current_date,
  created_at   timestamptz not null default now()
);

create index on public.addresses (user_id);
create index on public.quote_requests (user_id);
create index on public.maintenance_requests (user_id);
create index on public.orders (user_id);
create index on public.consent_events (user_id);

-- ── Funções auxiliares ──────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quote_requests_touch before update on public.quote_requests
  for each row execute function public.touch_updated_at();
create trigger maintenance_requests_touch before update on public.maintenance_requests
  for each row execute function public.touch_updated_at();

-- Cria o perfil quando alguém se regista. O registo FALHA se não houver
-- aceitação da Política de Privacidade — o consentimento é obrigatório no servidor,
-- não apenas no formulário.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  version text := meta ->> 'privacy_version';
  marketing boolean := coalesce((meta ->> 'marketing_opt_in')::boolean, false);
begin
  if version is null or version = '' then
    raise exception 'Privacy policy must be accepted';
  end if;

  insert into public.profiles (id, email, full_name, phone, privacy_version, marketing_opt_in, marketing_updated_at)
  values (new.id, coalesce(new.email, ''), coalesce(meta ->> 'full_name', ''), coalesce(meta ->> 'phone', ''),
          version, marketing, case when marketing then now() end);

  insert into public.consent_events (user_id, kind, version, granted) values
    (new.id, 'privacy', version, true),
    (new.id, 'terms', version, true),
    (new.id, 'marketing', null, marketing);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.consent_events       enable row level security;
alter table public.addresses            enable row level security;
alter table public.quote_requests       enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.orders               enable row level security;

-- Permissões por coluna: o cliente nunca consegue alterar o seu "role",
-- o estado de um pedido ou a resposta do administrador.
revoke all on public.profiles, public.consent_events, public.addresses,
              public.quote_requests, public.maintenance_requests, public.orders
  from anon, authenticated;

grant select on public.profiles, public.consent_events, public.addresses,
                public.quote_requests, public.maintenance_requests, public.orders
  to authenticated;

grant update (full_name, phone, marketing_opt_in, marketing_updated_at) on public.profiles to authenticated;
grant insert (user_id, kind, version, granted) on public.consent_events to authenticated;
grant insert (user_id, label, address, details, postcode, locality, lat, lng, source),
      delete on public.addresses to authenticated;
grant insert (user_id, category, message), update (status, admin_reply) on public.quote_requests to authenticated;
grant insert (user_id, address_id, service, equipment, preferred_date, notes),
      update (status, scheduled_for, admin_notes) on public.maintenance_requests to authenticated;
grant insert (user_id, description, status, order_date), update (status), delete on public.orders to authenticated;

-- profiles
create policy "own or admin read"  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "own update"         on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- consent_events
create policy "own or admin read"  on public.consent_events for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "own insert"         on public.consent_events for insert to authenticated
  with check (user_id = (select auth.uid()));

-- addresses
create policy "own or admin read"  on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "own insert"         on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "own delete"         on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));

-- quote_requests
create policy "own or admin read"  on public.quote_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "own insert"         on public.quote_requests for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "admin update"       on public.quote_requests for update to authenticated
  using ((select public.is_admin()));

-- maintenance_requests
create policy "own or admin read"  on public.maintenance_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "own insert"         on public.maintenance_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (address_id is null or exists (
      select 1 from public.addresses a where a.id = address_id and a.user_id = (select auth.uid())))
  );
create policy "admin update"       on public.maintenance_requests for update to authenticated
  using ((select public.is_admin()));

-- orders (só o administrador cria)
create policy "own or admin read"  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin insert"       on public.orders for insert to authenticated
  with check ((select public.is_admin()));
create policy "admin update"       on public.orders for update to authenticated
  using ((select public.is_admin()));
create policy "admin delete"       on public.orders for delete to authenticated
  using ((select public.is_admin()));

-- ── Tornar uma conta administrador (executar depois de se registar no site) ──
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'o-seu-email@exemplo.pt');
