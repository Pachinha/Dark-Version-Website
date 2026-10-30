-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 002: painel de administração completo
-- Pré-requisito: ter corrido schema.sql.
-- ANTES de correr: registe no site a conta joseprguerra+admin@gmail.com
-- (ou altere o email na última linha deste ficheiro).
-- Executar uma vez: Supabase → SQL Editor → New snippet → colar → Run
-- ════════════════════════════════════════════════════════════════════

-- ── Papéis: cliente, técnico, administrador ─────────────────────────
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('client', 'tecnico', 'admin'));

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'tecnico'));
$$;

-- Só um administrador muda papéis, e nunca o seu próprio.
create or replace function public.set_user_role(target uuid, new_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if target = auth.uid() then raise exception 'cannot change own role'; end if;
  if new_role not in ('client', 'tecnico', 'admin') then raise exception 'invalid role'; end if;
  update public.profiles set role = new_role where id = target;
end;
$$;
revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- ── Manutenções: técnico atribuído e duração ────────────────────────
alter table public.maintenance_requests
  add column technician_id    uuid references public.profiles on delete set null,
  add column duration_minutes integer not null default 120 check (duration_minutes between 15 and 1440);
create index on public.maintenance_requests (technician_id);
create index on public.maintenance_requests (scheduled_for);

-- ── Obras / instalações ─────────────────────────────────────────────
create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles on delete cascade,
  address_id       uuid references public.addresses on delete set null,
  quote_id         uuid references public.quote_requests on delete set null,
  technician_id    uuid references public.profiles on delete set null,
  title            text not null check (char_length(title) between 2 and 200),
  description      text not null default '',
  status           text not null default 'por_agendar'
                   check (status in ('por_agendar', 'agendado', 'em_curso', 'concluido', 'cancelado')),
  scheduled_start  timestamptz,
  scheduled_end    timestamptz,
  client_notes     text,          -- visível para o cliente
  internal_notes   text,          -- só equipa
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (scheduled_end is null or scheduled_start is null or scheduled_end >= scheduled_start)
);
create index on public.jobs (user_id);
create index on public.jobs (technician_id);
create index on public.jobs (scheduled_start);
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ── Registo de notificações enviadas ao cliente ─────────────────────
create table public.notifications (
  id          bigint generated always as identity primary key,
  client_id   uuid not null references public.profiles on delete cascade,
  entity      text not null check (entity in ('quote_requests', 'maintenance_requests', 'jobs')),
  entity_id   uuid not null,
  channel     text not null check (channel in ('email', 'whatsapp')),
  message     text not null,
  sent_by     uuid not null default auth.uid() references public.profiles on delete set null,
  created_at  timestamptz not null default now()
);
create index on public.notifications (entity_id);

-- ── Histórico de alterações (automático) ────────────────────────────
create table public.change_log (
  id          bigint generated always as identity primary key,
  entity      text not null,
  entity_id   uuid not null,
  changed_by  uuid references public.profiles on delete set null,
  old_data    jsonb not null,
  new_data    jsonb not null,
  created_at  timestamptz not null default now()
);
create index on public.change_log (entity_id);

create or replace function public.log_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (to_jsonb(old) - 'updated_at') = (to_jsonb(new) - 'updated_at') then
    return new;
  end if;
  insert into public.change_log (entity, entity_id, changed_by, old_data, new_data)
  values (tg_table_name, new.id, auth.uid(), to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

create trigger quote_requests_log after update on public.quote_requests
  for each row execute function public.log_change();
create trigger maintenance_requests_log after update on public.maintenance_requests
  for each row execute function public.log_change();
create trigger jobs_log after update on public.jobs
  for each row execute function public.log_change();

-- ── Técnicos: só mudam estado e notas; reagendar/reatribuir é do admin ──
create or replace function public.guard_maintenance_staff()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if public.is_admin() then return new; end if;
  if (new.scheduled_for, new.technician_id, new.duration_minutes)
     is distinct from (old.scheduled_for, old.technician_id, old.duration_minutes) then
    raise exception 'Only admins can reschedule or reassign';
  end if;
  return new;
end;
$$;
create trigger maintenance_requests_guard before update on public.maintenance_requests
  for each row execute function public.guard_maintenance_staff();

create or replace function public.guard_jobs_staff()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if public.is_admin() then return new; end if;
  if (new.scheduled_start, new.scheduled_end, new.technician_id, new.title, new.address_id, new.user_id)
     is distinct from (old.scheduled_start, old.scheduled_end, old.technician_id, old.title, old.address_id, old.user_id) then
    raise exception 'Only admins can reschedule or reassign';
  end if;
  return new;
end;
$$;
create trigger jobs_guard before update on public.jobs
  for each row execute function public.guard_jobs_staff();

-- O técnico vê os clientes e moradas dos serviços que lhe estão atribuídos.
create or replace function public.is_assigned_client(client uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.maintenance_requests where user_id = client and technician_id = auth.uid())
      or exists (select 1 from public.jobs where user_id = client and technician_id = auth.uid());
$$;

create or replace function public.is_assigned_address(addr uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.maintenance_requests where address_id = addr and technician_id = auth.uid())
      or exists (select 1 from public.jobs where address_id = addr and technician_id = auth.uid());
$$;

-- ── Permissões ──────────────────────────────────────────────────────
revoke all on public.jobs, public.notifications, public.change_log from anon, authenticated;
grant select on public.jobs, public.notifications, public.change_log to authenticated;

grant update (technician_id, duration_minutes) on public.maintenance_requests to authenticated;
grant insert (user_id, address_id, quote_id, technician_id, title, description, status,
              scheduled_start, scheduled_end, client_notes, internal_notes),
      update (address_id, technician_id, title, description, status,
              scheduled_start, scheduled_end, client_notes, internal_notes),
      delete on public.jobs to authenticated;
grant insert (client_id, entity, entity_id, channel, message) on public.notifications to authenticated;

alter table public.jobs          enable row level security;
alter table public.notifications enable row level security;
alter table public.change_log    enable row level security;

-- Perfis e moradas: técnicos veem os clientes atribuídos
drop policy "own or admin read" on public.profiles;
create policy "own, admin or assigned read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()) or public.is_assigned_client(id)
         or (role in ('admin', 'tecnico') and (select public.is_staff())));

drop policy "own or admin read" on public.addresses;
create policy "own, admin or assigned read" on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or public.is_assigned_address(id));

-- Manutenções
drop policy "own or admin read" on public.maintenance_requests;
create policy "own, admin or assigned read" on public.maintenance_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or technician_id = (select auth.uid()));
drop policy "admin update" on public.maintenance_requests;
create policy "admin or assigned update" on public.maintenance_requests for update to authenticated
  using ((select public.is_admin()) or technician_id = (select auth.uid()));

-- Obras
create policy "own, admin or assigned read" on public.jobs for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or technician_id = (select auth.uid()));
create policy "admin insert" on public.jobs for insert to authenticated
  with check ((select public.is_admin()));
create policy "admin or assigned update" on public.jobs for update to authenticated
  using ((select public.is_admin()) or technician_id = (select auth.uid()));
create policy "admin delete" on public.jobs for delete to authenticated
  using ((select public.is_admin()));

-- Notificações e histórico: só equipa
create policy "staff read" on public.notifications for select to authenticated
  using ((select public.is_admin()) or sent_by = (select auth.uid()));
create policy "staff insert" on public.notifications for insert to authenticated
  with check ((select public.is_staff()) and sent_by = (select auth.uid()));

create policy "admin or own read" on public.change_log for select to authenticated
  using ((select public.is_admin()) or changed_by = (select auth.uid()));

-- ── Conta de administrador ──────────────────────────────────────────
update public.profiles set role = 'admin' where email = 'joseprguerra+admin@gmail.com';
