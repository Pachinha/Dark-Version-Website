-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 005: novo pedido de orçamento
--  • o cliente pode pedir orçamento SEM conta (login opcional)
--  • mais informação para preparar a visita técnica + fotos
--  • novos estados: pedido → visita → orçamento → aceite/recusado
-- Pré-requisito: 004_preferencias_pedido.sql
-- Executar uma vez: Supabase → SQL Editor → New snippet → colar → Run
-- ════════════════════════════════════════════════════════════════════

-- ── Pedidos sem conta ───────────────────────────────────────────────
-- Os pedidos passam a ser gravados pelo servidor do site (chave secreta),
-- depois de validados. O browser deixa de poder inserir diretamente.
alter table public.quote_requests alter column user_id drop not null;

alter table public.quote_requests
  add column name               text not null default '',
  add column email              text not null default '',
  add column phone              text not null default '',
  add column work_type          text check (work_type in ('nova', 'substituir', 'converter', 'nao_sei')),
  add column home_type          text check (home_type in ('moradia', 'apartamento', 'outro')),
  add column chimney            text check (chimney in ('sim', 'nao', 'nao_sei')),
  add column area_m2            integer check (area_m2 between 5 and 2000),
  add column fuel               text check (fuel in ('lenha', 'pellets', 'gas', 'eletrico', 'bioetanol', 'aconselhar')),
  add column municipality       text not null default '',
  add column address            text not null default '',
  add column outside_area       boolean not null default false,
  add column availability       text[] not null default '{}' check (availability <@ array[
    'seg-manha', 'seg-tarde', 'ter-manha', 'ter-tarde', 'qua-manha',
    'qua-tarde', 'qui-manha', 'qui-tarde', 'sex-manha', 'sex-tarde']::text[]),
  add column contact_preference text not null default 'telefone'
    check (contact_preference in ('telefone', 'whatsapp', 'email')),
  add column photos             text[] not null default '{}' check (cardinality(photos) <= 6),
  add column visit_at           timestamptz,
  add column privacy_version    text;

-- A descrição passa a ser opcional (o formulário já recolhe o essencial).
alter table public.quote_requests drop constraint quote_requests_message_check;
alter table public.quote_requests alter column message set default '';
alter table public.quote_requests add constraint quote_requests_message_check check (char_length(message) <= 4000);

-- Sem conta, o pedido tem de trazer nome, telefone e aceitação da privacidade.
alter table public.quote_requests add constraint quote_requests_contact_check check (
  user_id is not null or (char_length(name) >= 2 and char_length(phone) >= 9 and privacy_version is not null)
);

-- ── Estados ─────────────────────────────────────────────────────────
alter table public.quote_requests drop constraint quote_requests_status_check;
update public.quote_requests set status = case status
  when 'em_analise' then 'novo'
  when 'respondido' then 'orcamento_enviado'
  when 'fechado'    then 'cancelado'
  else status end;
alter table public.quote_requests add constraint quote_requests_status_check check (status in (
  'novo', 'visita_marcada', 'visita_feita', 'orcamento_enviado', 'aceite', 'recusado', 'cancelado'));

create index on public.quote_requests (status);
create index on public.quote_requests (visit_at);
create index on public.quote_requests (lower(email));

-- ── Permissões ──────────────────────────────────────────────────────
drop policy "own insert" on public.quote_requests;
revoke insert on public.quote_requests from authenticated;
grant update (visit_at) on public.quote_requests to authenticated;

-- Quem criar conta (com email confirmado) passa a ver os pedidos que fez sem conta.
create or replace function public.claim_guest_quotes()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  claimed integer;
begin
  update public.quote_requests q
     set user_id = auth.uid()
   where q.user_id is null
     and q.email <> ''
     and lower(q.email) = (select lower(u.email) from auth.users u
                           where u.id = auth.uid() and u.email_confirmed_at is not null);
  get diagnostics claimed = row_count;
  return claimed;
end;
$$;
revoke execute on function public.claim_guest_quotes() from public, anon;
grant execute on function public.claim_guest_quotes() to authenticated;

-- Notificações a clientes sem conta
alter table public.notifications alter column client_id drop not null;

-- ── Fotos (privadas: só o servidor e a equipa, via links temporários) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-photos', 'quote-photos', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
