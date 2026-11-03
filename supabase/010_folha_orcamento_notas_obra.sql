-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 010: folha de orçamento (PDF), obra a partir do orçamento, notas de obra
--  • folha de orçamento com linhas (quant., designação, preço unit.), IVA e desconto —
--    substitui a folha em papel; enviada ao cliente em PDF (email + link no WhatsApp)
--  • pedido passa a "em obra" quando o cliente confirma e a obra é iniciada
--  • obras também para pedidos feitos sem conta (os contactos ficam no pedido)
--  • notas de obra da equipa (material, alterações) — a administração recebe aviso
-- Pré-requisito: 009_sem_estado_aceite.sql
-- ════════════════════════════════════════════════════════════════════

-- ── Estado "em obra" ────────────────────────────────────────────────
alter table public.quote_requests drop constraint quote_requests_status_check;
alter table public.quote_requests add constraint quote_requests_status_check check (status in (
  'novo', 'visita_marcada', 'visita_feita', 'orcamento_enviado', 'em_obra', 'recusado', 'cancelado'));

-- ── Folhas de orçamento ─────────────────────────────────────────────
-- items: [{ "qty": 1, "description": "Recuperador …", "unit_price": 1200.00 }, …] — preços sem IVA.
create table public.quote_sheets (
  id              uuid primary key default gen_random_uuid(),
  number          integer generated always as identity unique,
  quote_id        uuid not null references public.quote_requests on delete cascade,
  items           jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60),
  vat_rate        numeric(5,2) not null default 23 check (vat_rate between 0 and 100),
  discount_pct    numeric(5,2) not null default 0 check (discount_pct between 0 and 100),
  payment_terms   text not null default '' check (char_length(payment_terms) <= 1000),
  notes           text not null default '' check (char_length(notes) <= 2000),
  -- Link privado do PDF para o cliente (WhatsApp): impossível de adivinhar.
  token           uuid not null unique default gen_random_uuid(),
  sent_at         timestamptz,
  created_by      uuid default auth.uid() references public.profiles on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.quote_sheets (quote_id);
create trigger quote_sheets_touch before update on public.quote_sheets
  for each row execute function public.touch_updated_at();

-- ── Obras sem conta de cliente (a partir de um pedido feito sem conta) ─
alter table public.jobs alter column user_id drop not null;
alter table public.jobs add constraint jobs_client_check check (user_id is not null or quote_id is not null);
create index if not exists jobs_quote_id_idx on public.jobs (quote_id);

-- O técnico da obra pode ver o pedido e a folha de orçamento dessa obra.
create or replace function public.is_assigned_quote(quote uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_technician_session()
     and exists (select 1 from public.jobs j where j.quote_id = quote and j.technician_id = auth.uid());
$$;

-- ── Notas de obra ───────────────────────────────────────────────────
create table public.job_notes (
  id                 bigint generated always as identity primary key,
  job_id             uuid not null references public.jobs on delete cascade,
  author_id          uuid default auth.uid() references public.profiles on delete set null,
  kind               text not null default 'nota' check (kind in ('nota', 'material', 'alteracao')),
  body               text not null check (char_length(body) between 1 and 2000),
  client_notified_at timestamptz,
  created_at         timestamptz not null default now()
);
create index on public.job_notes (job_id);

create or replace function public.is_assigned_job(job uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_technician_session()
     and exists (select 1 from public.jobs j where j.id = job and j.technician_id = auth.uid());
$$;

revoke execute on function public.is_assigned_quote(uuid) from public, anon;
revoke execute on function public.is_assigned_job(uuid)   from public, anon;
grant  execute on function public.is_assigned_quote(uuid) to authenticated;
grant  execute on function public.is_assigned_job(uuid)   to authenticated;

-- ── Permissões ──────────────────────────────────────────────────────
revoke all on public.quote_sheets, public.job_notes from anon, authenticated;
grant select, delete on public.quote_sheets to authenticated;
grant insert (quote_id, items, vat_rate, discount_pct, payment_terms, notes),
      update (items, vat_rate, discount_pct, payment_terms, notes, sent_at) on public.quote_sheets to authenticated;
grant select, delete on public.job_notes to authenticated;
grant insert (job_id, kind, body), update (client_notified_at) on public.job_notes to authenticated;

alter table public.quote_sheets enable row level security;
alter table public.job_notes    enable row level security;

-- Folhas: o administrador gere; o técnico da obra só consulta.
create policy "admin or assigned read" on public.quote_sheets for select to authenticated
  using ((select public.is_admin()) or public.is_assigned_quote(quote_id));
create policy "admin insert" on public.quote_sheets for insert to authenticated
  with check ((select public.is_admin()));
create policy "admin update" on public.quote_sheets for update to authenticated
  using ((select public.is_admin()));
create policy "admin delete" on public.quote_sheets for delete to authenticated
  using ((select public.is_admin()));

-- O técnico da obra vê o pedido que lhe deu origem (contactos e morada do cliente sem conta).
drop policy "own, admin or shared read" on public.quote_requests;
create policy "own, admin, shared or assigned read" on public.quote_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or public.is_shared_quote(id)
         or public.is_assigned_quote(id));

-- Notas: administração e técnico da obra escrevem e leem; só a administração apaga
-- e marca "cliente avisado".
create policy "admin or assigned read" on public.job_notes for select to authenticated
  using ((select public.is_admin()) or public.is_assigned_job(job_id));
create policy "admin or assigned insert" on public.job_notes for insert to authenticated
  with check (author_id = (select auth.uid()) and ((select public.is_admin()) or public.is_assigned_job(job_id)));
create policy "admin update" on public.job_notes for update to authenticated
  using ((select public.is_admin()));
create policy "admin delete" on public.job_notes for delete to authenticated
  using ((select public.is_admin()));
