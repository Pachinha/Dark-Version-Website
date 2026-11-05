-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 017: pedir limpeza/manutenção no site sem conta
--  • o pedido sem conta traz nome, telefone, morada verificada e a aceitação da política
--    de privacidade (como o pedido de orçamento)
--  • concelho e código postal da morada, para a equipa saber logo onde é
--  • quem cria conta com o mesmo email (confirmado) passa a ver também estes pedidos
-- As inserções são feitas pelo servidor (depois de validar tudo). Pré-requisito: 016
-- ════════════════════════════════════════════════════════════════════

alter table public.maintenance_requests
  add column privacy_version text,
  add column municipality    text not null default '' check (char_length(municipality) <= 120),
  add column postcode        text not null default '' check (char_length(postcode) <= 20);

-- Um pedido sem conta feito no site precisa de nome, telefone e da política aceite;
-- um registo da administração (created_by) continua a precisar só do nome.
alter table public.maintenance_requests drop constraint maintenance_client_check;
alter table public.maintenance_requests add constraint maintenance_client_check check (
  user_id is not null
  or (created_by is not null and char_length(name) > 0)
  or (char_length(name) >= 2 and char_length(phone) >= 9 and privacy_version is not null)
);

-- Ao entrar na área de cliente: os pedidos feitos sem conta com o mesmo email (confirmado)
-- passam para a conta — agora também as limpezas/manutenções.
create or replace function public.claim_guest_quotes()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  confirmed text;
  claimed integer;
  more integer;
begin
  select lower(u.email) into confirmed from auth.users u
   where u.id = auth.uid() and u.email_confirmed_at is not null;
  if confirmed is null or confirmed = '' then return 0; end if;

  update public.quote_requests q set user_id = auth.uid()
   where q.user_id is null and q.email <> '' and lower(q.email) = confirmed;
  get diagnostics claimed = row_count;

  update public.maintenance_requests m set user_id = auth.uid()
   where m.user_id is null and m.email <> '' and lower(m.email) = confirmed;
  get diagnostics more = row_count;
  return claimed + more;
end;
$$;
