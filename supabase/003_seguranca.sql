-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 003: segurança reforçada da equipa
-- Os poderes de administrador e técnico só funcionam numa sessão com
-- verificação em dois passos (aal2). Uma palavra-passe roubada, sozinha,
-- não dá acesso a dados de clientes — a base de dados recusa.
-- Pré-requisito: 002_painel_admin.sql
-- ════════════════════════════════════════════════════════════════════

-- Sessão confirmada com o código do telemóvel?
create or replace function public.mfa_ok()
returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.mfa_ok()
     and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.mfa_ok()
     and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'tecnico'));
$$;

-- Técnico: só com 2FA e só se ainda for técnico (um ex-técnico despromovido perde o acesso)
create or replace function public.is_technician_session()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.mfa_ok()
     and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'tecnico'));
$$;

create or replace function public.is_assigned_client(client uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_technician_session() and (
       exists (select 1 from public.maintenance_requests where user_id = client and technician_id = auth.uid())
    or exists (select 1 from public.jobs where user_id = client and technician_id = auth.uid()));
$$;

create or replace function public.is_assigned_address(addr uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_technician_session() and (
       exists (select 1 from public.maintenance_requests where address_id = addr and technician_id = auth.uid())
    or exists (select 1 from public.jobs where address_id = addr and technician_id = auth.uid()));
$$;

-- Políticas do técnico passam a exigir sessão com 2FA
drop policy "own, admin or assigned read" on public.maintenance_requests;
create policy "own, admin or assigned read" on public.maintenance_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin())
         or (technician_id = (select auth.uid()) and (select public.is_technician_session())));

drop policy "admin or assigned update" on public.maintenance_requests;
create policy "admin or assigned update" on public.maintenance_requests for update to authenticated
  using ((select public.is_admin())
         or (technician_id = (select auth.uid()) and (select public.is_technician_session())));

drop policy "own, admin or assigned read" on public.jobs;
create policy "own, admin or assigned read" on public.jobs for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin())
         or (technician_id = (select auth.uid()) and (select public.is_technician_session())));

drop policy "admin or assigned update" on public.jobs;
create policy "admin or assigned update" on public.jobs for update to authenticated
  using ((select public.is_admin())
         or (technician_id = (select auth.uid()) and (select public.is_technician_session())));
