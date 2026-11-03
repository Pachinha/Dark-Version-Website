-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 008: morada verificada, colaboradores, partilha e comentários
--  • pedido de orçamento: morada escolhida numa pesquisa real (OpenStreetMap),
--    com coordenadas → botões Google Maps / Waze levam à porta do cliente
--  • novo papel "colaborador": só consulta (sem alterar nada) os clientes que
--    o administrador partilhar com ele, e pode deixar comentários
--  • partilha de clientes (com conta) e de pedidos de orçamento (sem conta)
--  • comentários internos sobre um cliente ou pedido
-- Pré-requisito: 007_endurecer_funcoes.sql
-- Executar uma vez: Supabase → SQL Editor → New snippet → colar → Run
-- ════════════════════════════════════════════════════════════════════

-- ── Morada do pedido de orçamento ───────────────────────────────────
-- Pedidos antigos ficam sem coordenadas (o backoffice usa a pesquisa por texto).
alter table public.quote_requests
  add column lat             double precision check (lat between 32.3 and 42.2),
  add column lng             double precision check (lng between -31.5 and -6.1),
  add column postcode        text not null default '',
  add column locality        text not null default '',
  add column address_details text not null default '' check (char_length(address_details) <= 200),
  add constraint quote_requests_coords_check check ((lat is null) = (lng is null));

-- ── Papel "colaborador" ─────────────────────────────────────────────
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('client', 'colaborador', 'tecnico', 'admin'));

create or replace function public.set_user_role(target uuid, new_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if target = auth.uid() then raise exception 'cannot change own role'; end if;
  if new_role not in ('client', 'colaborador', 'tecnico', 'admin') then raise exception 'invalid role'; end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

-- Qualquer pessoa do painel (admin, técnico ou colaborador), sempre com 2FA.
create or replace function public.is_panel_session()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.mfa_ok()
     and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'tecnico', 'colaborador'));
$$;

-- ── Partilhas ───────────────────────────────────────────────────────
-- Ou um cliente com conta (client_id), ou um pedido de orçamento (quote_id).
create table public.client_shares (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references public.profiles on delete cascade,
  client_id   uuid references public.profiles on delete cascade,
  quote_id    uuid references public.quote_requests on delete cascade,
  shared_by   uuid default auth.uid() references public.profiles on delete set null,
  created_at  timestamptz not null default now(),
  check ((client_id is null) <> (quote_id is null))
);
-- Índices únicos parciais (e não uma "unique constraint" com as três colunas): assim o
-- Supabase não vê esta tabela como ligação entre pedidos e perfis, e os
-- "profiles(...)" que o site já usa continuam sem ambiguidade.
create unique index client_shares_client_unique on public.client_shares (staff_id, client_id) where client_id is not null;
create unique index client_shares_quote_unique  on public.client_shares (staff_id, quote_id)  where quote_id is not null;
create index on public.client_shares (client_id);
create index on public.client_shares (quote_id);

-- ── Comentários ─────────────────────────────────────────────────────
create table public.client_comments (
  id          bigint generated always as identity primary key,
  author_id   uuid default auth.uid() references public.profiles on delete set null,
  client_id   uuid references public.profiles on delete cascade,
  quote_id    uuid references public.quote_requests on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  check ((client_id is null) <> (quote_id is null))
);
create index on public.client_comments (client_id);
create index on public.client_comments (quote_id);

-- ── Acesso por partilha ─────────────────────────────────────────────
create or replace function public.is_shared_client(client uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_panel_session()
     and exists (select 1 from public.client_shares s where s.staff_id = auth.uid() and s.client_id = client);
$$;

-- Um pedido está acessível se foi partilhado, ou se o cliente dono do pedido foi partilhado.
create or replace function public.is_shared_quote(quote uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_panel_session() and (
       exists (select 1 from public.client_shares s where s.staff_id = auth.uid() and s.quote_id = quote)
    or exists (select 1 from public.quote_requests q
               join public.client_shares s on s.client_id = q.user_id
               where q.id = quote and s.staff_id = auth.uid()));
$$;

revoke execute on function public.is_panel_session()      from public, anon;
revoke execute on function public.is_shared_client(uuid)  from public, anon;
revoke execute on function public.is_shared_quote(uuid)   from public, anon;
grant  execute on function public.is_panel_session()      to authenticated;
grant  execute on function public.is_shared_client(uuid)  to authenticated;
grant  execute on function public.is_shared_quote(uuid)   to authenticated;

-- ── Leitura (só leitura) para quem recebeu a partilha ───────────────
-- Perfis: o próprio, admin, técnico atribuído, cliente partilhado, e a equipa entre si
-- (para mostrar quem escreveu cada comentário).
drop policy "own, admin or assigned read" on public.profiles;
create policy "own, admin, assigned or shared read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()) or public.is_assigned_client(id)
         or public.is_shared_client(id)
         or (role in ('admin', 'tecnico', 'colaborador') and (select public.is_panel_session())));

drop policy "own, admin or assigned read" on public.addresses;
create policy "own, admin, assigned or shared read" on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or public.is_assigned_address(id)
         or public.is_shared_client(user_id));

drop policy "own or admin read" on public.quote_requests;
create policy "own, admin or shared read" on public.quote_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or public.is_shared_quote(id));

drop policy "own, admin or assigned read" on public.maintenance_requests;
create policy "own, admin, assigned or shared read" on public.maintenance_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin())
         or (technician_id = (select auth.uid()) and (select public.is_technician_session()))
         or public.is_shared_client(user_id));

drop policy "own, admin or assigned read" on public.jobs;
create policy "own, admin, assigned or shared read" on public.jobs for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin())
         or (technician_id = (select auth.uid()) and (select public.is_technician_session()))
         or public.is_shared_client(user_id));
-- Nota: as políticas de alteração não mudam — o colaborador não tem nenhuma,
-- por isso a base de dados recusa qualquer alteração vinda dele.

-- ── Permissões das tabelas novas ────────────────────────────────────
revoke all on public.client_shares, public.client_comments from anon, authenticated;
grant select, delete on public.client_shares to authenticated;
grant insert (staff_id, client_id, quote_id) on public.client_shares to authenticated;
grant select on public.client_comments to authenticated;
grant insert (client_id, quote_id, body) on public.client_comments to authenticated;
grant delete on public.client_comments to authenticated;

alter table public.client_shares   enable row level security;
alter table public.client_comments enable row level security;

-- Partilhas: o admin gere; cada pessoa vê as que lhe foram feitas.
create policy "admin or own read" on public.client_shares for select to authenticated
  using ((select public.is_admin()) or (staff_id = (select auth.uid()) and (select public.is_panel_session())));
create policy "admin insert" on public.client_shares for insert to authenticated
  with check ((select public.is_admin())
              and exists (select 1 from public.profiles p where p.id = staff_id and p.role in ('tecnico', 'colaborador')));
create policy "admin delete" on public.client_shares for delete to authenticated
  using ((select public.is_admin()));

-- Comentários: visíveis e permitidos a quem tem acesso ao cliente/pedido.
create policy "admin or shared read" on public.client_comments for select to authenticated
  using ((select public.is_admin())
         or (client_id is not null and public.is_shared_client(client_id))
         or (quote_id is not null and public.is_shared_quote(quote_id)));
create policy "admin or shared insert" on public.client_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and (
         (select public.is_admin())
      or (client_id is not null and public.is_shared_client(client_id))
      or (quote_id is not null and public.is_shared_quote(quote_id))));
create policy "admin delete" on public.client_comments for delete to authenticated
  using ((select public.is_admin()));
