-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 016: ficha de cliente automática (com ou sem conta)
--  • cada pedido de orçamento, limpeza/manutenção e obra fica ligado a uma ficha
--    (public.customers), reconhecida automaticamente pelo telefone e, na falta deste, pelo email
--  • o cliente nunca sabe que foi reconhecido: tudo acontece na base de dados, num trigger
--  • nome e morada NÃO juntam fichas sozinhos (homónimos, famílias): o painel mostra
--    "possível repetido" e a administração decide juntar ou marcar como pessoas diferentes
--  • quem cria conta fica ligado à ficha com o mesmo email; apagar a conta apaga a ficha
--  • a área de cliente continua a mostrar só os pedidos feitos com sessão iniciada (user_id)
-- Pré-requisito: 015_sem_catalogos_pdf.sql
-- ════════════════════════════════════════════════════════════════════

-- Telefone normalizado para comparar: só algarismos, sem 00 inicial; número português de
-- 9 algarismos sem indicativo ganha o 351 ("912 345 678" = "+351912345678").
create or replace function public.phone_key(p text)
returns text
language sql immutable set search_path = ''
as $$
  select case
    when d = '' then null
    when length(d) = 9 and d ~ '^[29]' then '351' || d
    else d
  end
  from (select regexp_replace(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '^00', '') as d) s;
$$;

-- Nome normalizado para detetar possíveis repetidos (minúsculas, sem acentos, espaços simples).
create or replace function public.name_key(p text)
returns text
language sql immutable set search_path = ''
as $$
  select nullif(regexp_replace(lower(translate(trim(coalesce(p, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')), '\s+', ' ', 'g'), '');
$$;

-- ── Fichas ──────────────────────────────────────────────────────────
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  -- Conta no site (se tiver). Apagar a conta apaga a ficha (direito ao apagamento).
  user_id     uuid unique references public.profiles on delete cascade,
  name        text not null default '' check (char_length(name) <= 120),
  phone       text not null default '' check (char_length(phone) <= 40),
  email       text not null default '' check (char_length(email) <= 200),
  notes       text not null default '' check (char_length(notes) <= 4000),
  phone_key   text generated always as (public.phone_key(phone)) stored,
  email_key   text generated always as (nullif(lower(trim(email)), '')) stored,
  name_key    text generated always as (public.name_key(name)) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.customers (phone_key);
create index on public.customers (email_key);
create index on public.customers (name_key);
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- Pares que a administração confirmou serem pessoas diferentes (deixam de aparecer como repetidos).
create table public.customer_not_duplicates (
  a           uuid not null references public.customers on delete cascade,
  b           uuid not null references public.customers on delete cascade,
  created_by  uuid default auth.uid() references public.profiles on delete set null,
  created_at  timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);

alter table public.quote_requests       add column customer_id uuid references public.customers on delete set null;
alter table public.maintenance_requests add column customer_id uuid references public.customers on delete set null;
alter table public.jobs                 add column customer_id uuid references public.customers on delete set null;
create index on public.quote_requests (customer_id);
create index on public.maintenance_requests (customer_id);
create index on public.jobs (customer_id);

-- Encontra a ficha pelo telefone e depois pelo email; se não houver, cria. Preenche contactos em falta.
-- Uma ficha com conta só recebe pedidos dessa conta ou pedidos sem conta (nunca de outra conta).
create or replace function public.find_or_create_customer(p_user uuid, p_name text, p_phone text, p_email text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  k_phone text := public.phone_key(p_phone);
  k_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_id uuid;
begin
  if p_user is not null then
    select id into v_id from public.customers where user_id = p_user;
  end if;
  if v_id is null and k_phone is not null then
    select id into v_id from public.customers
     where phone_key = k_phone and (user_id is null or p_user is null or user_id = p_user)
     order by (user_id is not null) desc, created_at limit 1;
  end if;
  if v_id is null and k_email is not null then
    select id into v_id from public.customers
     where email_key = k_email and (user_id is null or p_user is null or user_id = p_user)
     order by (user_id is not null) desc, created_at limit 1;
  end if;

  if v_id is null then
    insert into public.customers (user_id, name, phone, email)
    values (p_user, left(coalesce(p_name, ''), 120), left(coalesce(p_phone, ''), 40), left(coalesce(k_email, ''), 200))
    returning id into v_id;
  else
    update public.customers set
      user_id = coalesce(user_id, p_user),
      name    = case when name  = '' then left(coalesce(p_name, ''), 120) else name end,
      phone   = case when phone = '' then left(coalesce(p_phone, ''), 40) else phone end,
      email   = case when email = '' then left(coalesce(k_email, ''), 200) else email end
    where id = v_id;
  end if;
  return v_id;
end;
$$;

-- Antes de gravar um pedido/obra: liga-o à ficha. Um customer_id já indicado (escolhido pela
-- administração no painel) é respeitado.
create or replace function public.assign_customer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_name text := coalesce(new.name, '');
  v_phone text := coalesce(new.phone, '');
  v_email text := coalesce(new.email, '');
  p record;
begin
  if new.customer_id is not null then return new; end if;
  -- Obra criada a partir de um orçamento: o cliente é o do orçamento.
  if tg_table_name = 'jobs' then
    if new.quote_id is not null then
      select customer_id into new.customer_id from public.quote_requests where id = new.quote_id;
      if new.customer_id is not null then return new; end if;
      select name, phone, email into v_name, v_phone, v_email from public.quote_requests where id = new.quote_id;
    end if;
  end if;
  -- Pedido com conta: os contactos em falta vêm do perfil.
  if new.user_id is not null then
    select full_name, coalesce(phone, '') as phone, email into p from public.profiles where id = new.user_id;
    if found then
      v_name  := coalesce(nullif(v_name, ''), p.full_name);
      v_phone := coalesce(nullif(v_phone, ''), p.phone);
      v_email := coalesce(nullif(v_email, ''), p.email);
    end if;
  end if;
  if new.user_id is null and v_name = '' and v_phone = '' and v_email = '' then return new; end if;
  new.customer_id := public.find_or_create_customer(new.user_id, v_name, v_phone, v_email);
  return new;
end;
$$;

create trigger quote_requests_customer before insert on public.quote_requests
  for each row execute function public.assign_customer();
create trigger maintenance_requests_customer before insert on public.maintenance_requests
  for each row execute function public.assign_customer();
create trigger jobs_customer before insert on public.jobs
  for each row execute function public.assign_customer();

-- Conta nova: liga-se à ficha que já tinha o mesmo email (pedidos anteriores sem conta).
create or replace function public.link_customer_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.role = 'client' and coalesce(new.email, '') <> ''
     and not exists (select 1 from public.customers where user_id = new.id) then
    update public.customers set user_id = new.id
     where id = (select id from public.customers
                  where user_id is null and email_key = lower(trim(new.email))
                  order by created_at limit 1);
  end if;
  return new;
end;
$$;
create trigger profiles_link_customer after insert on public.profiles
  for each row execute function public.link_customer_profile();

-- ── Juntar duas fichas (só administração com 2FA) ───────────────────
create or replace function public.merge_customers(keep uuid, other uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  k public.customers;
  o public.customers;
begin
  if not public.is_admin() then raise exception 'Only admins can merge customers'; end if;
  if keep = other then return; end if;
  select * into k from public.customers where id = keep for update;
  select * into o from public.customers where id = other for update;
  if k.id is null or o.id is null then raise exception 'Customer not found'; end if;
  if k.user_id is not null and o.user_id is not null then
    raise exception 'Both customers have a site account';
  end if;

  update public.quote_requests       set customer_id = keep where customer_id = other;
  update public.maintenance_requests set customer_id = keep where customer_id = other;
  update public.jobs                 set customer_id = keep where customer_id = other;
  delete from public.customers where id = other;
  update public.customers set
    user_id = coalesce(k.user_id, o.user_id),
    name    = coalesce(nullif(k.name, ''), o.name),
    phone   = coalesce(nullif(k.phone, ''), o.phone),
    email   = coalesce(nullif(k.email, ''), o.email),
    notes   = left(concat_ws(E'\n', nullif(k.notes, ''), nullif(o.notes, '')), 4000)
  where id = keep;
end;
$$;

-- ── Possíveis repetidos: mesmo nome, ou mesma morada num dos pedidos ─
create or replace function public.customer_duplicates()
returns table (a uuid, b uuid, reason text)
language sql stable security definer set search_path = ''
as $$
  with places as (
    select customer_id, round(lat::numeric, 3) as la, round(lng::numeric, 3) as ln, lower(trim(address)) as addr
      from public.quote_requests where customer_id is not null and address <> ''
    union
    select customer_id, round(lat::numeric, 3), round(lng::numeric, 3), lower(trim(address))
      from public.maintenance_requests where customer_id is not null and address <> ''
    union
    select customer_id, round(lat::numeric, 3), round(lng::numeric, 3), lower(trim(address))
      from public.jobs where customer_id is not null and address <> ''
    union
    select c.id, round(ad.lat::numeric, 3), round(ad.lng::numeric, 3), lower(trim(ad.address))
      from public.addresses ad join public.customers c on c.user_id = ad.user_id
  ),
  pairs as (
    select c1.id as a, c2.id as b, 'nome' as reason
      from public.customers c1 join public.customers c2 on c1.name_key = c2.name_key and c1.id < c2.id
    union all
    select distinct p1.customer_id, p2.customer_id, 'morada'
      from places p1 join places p2
        on p1.customer_id < p2.customer_id
       and (p1.addr = p2.addr or (p1.la is not null and p1.la = p2.la and p1.ln = p2.ln))
  )
  select p.a, p.b, string_agg(distinct p.reason, ' + ' order by p.reason)
    from pairs p
   where public.is_admin()
     and not exists (select 1 from public.customer_not_duplicates n where n.a = p.a and n.b = p.b)
     -- duas contas diferentes nunca se juntam
     and not exists (select 1 from public.customers x join public.customers y on y.id = p.b
                      where x.id = p.a and x.user_id is not null and y.user_id is not null)
   group by p.a, p.b;
$$;

-- ── Permissões: só a administração vê e edita fichas ────────────────
revoke all on public.customers, public.customer_not_duplicates from anon, authenticated;
grant select on public.customers to authenticated;
grant update (name, phone, email, notes) on public.customers to authenticated;
grant select, insert (a, b), delete on public.customer_not_duplicates to authenticated;
alter table public.customers enable row level security;
alter table public.customer_not_duplicates enable row level security;
create policy "admin read" on public.customers for select to authenticated using (public.is_admin());
create policy "admin update" on public.customers for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all" on public.customer_not_duplicates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on function public.find_or_create_customer(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.assign_customer() from public, anon, authenticated;
revoke all on function public.link_customer_profile() from public, anon, authenticated;
revoke all on function public.merge_customers(uuid, uuid) from public, anon;
revoke all on function public.customer_duplicates() from public, anon;
grant execute on function public.merge_customers(uuid, uuid) to authenticated;
grant execute on function public.customer_duplicates() to authenticated;

-- O histórico de alterações ignora a ligação à ficha (não é uma alteração feita por alguém).
create or replace function public.log_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (to_jsonb(old) - 'updated_at' - 'customer_id') = (to_jsonb(new) - 'updated_at' - 'customer_id') then
    return new;
  end if;
  insert into public.change_log (entity, entity_id, changed_by, old_data, new_data)
  values (tg_table_name, new.id, auth.uid(), to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

-- ── Fichas para tudo o que já existe (por ordem de chegada) ─────────
do $$
declare
  r record;
  p record;
  v uuid;
  v_name text;
  v_phone text;
  v_email text;
begin
  -- Contas de clientes primeiro: os pedidos sem conta com o mesmo telefone/email juntam-se a elas.
  for r in select id, full_name, coalesce(phone, '') as phone, email from public.profiles
            where role = 'client' order by created_at loop
    perform public.find_or_create_customer(r.id, r.full_name, r.phone, r.email);
  end loop;

  for r in
    select 'q' as t, id, user_id, name, phone, email, null::uuid as quote_id, created_at from public.quote_requests
    union all select 'm', id, user_id, name, phone, email, null, created_at from public.maintenance_requests
    union all select 'j', id, user_id, name, phone, email, quote_id, created_at from public.jobs
    order by created_at
  loop
    v := null;
    v_name := coalesce(r.name, ''); v_phone := coalesce(r.phone, ''); v_email := coalesce(r.email, '');
    if r.quote_id is not null then
      select customer_id, name, phone, email into v, v_name, v_phone, v_email from public.quote_requests where id = r.quote_id;
    end if;
    if v is null then
      if r.user_id is not null then
        select full_name, coalesce(phone, '') as phone, email into p from public.profiles where id = r.user_id;
        if found then
          v_name := coalesce(nullif(v_name, ''), p.full_name);
          v_phone := coalesce(nullif(v_phone, ''), p.phone);
          v_email := coalesce(nullif(v_email, ''), p.email);
        end if;
      end if;
      if r.user_id is not null or v_name <> '' or v_phone <> '' or v_email <> '' then
        v := public.find_or_create_customer(r.user_id, v_name, v_phone, v_email);
      end if;
    end if;
    if v is not null then
      if r.t = 'q' then update public.quote_requests set customer_id = v where id = r.id;
      elsif r.t = 'm' then update public.maintenance_requests set customer_id = v where id = r.id;
      else update public.jobs set customer_id = v where id = r.id;
      end if;
    end if;
  end loop;
end;
$$;
