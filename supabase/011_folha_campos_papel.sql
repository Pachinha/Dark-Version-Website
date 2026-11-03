-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 011: folha de orçamento com todos os campos da folha em papel
--  • tipo: Orçamento e/ou Nota de encomenda (as duas caixas da folha)
--  • Entrega, N.I.F. do cliente
--  • Cliente / Morada / Telefone guardados na própria folha (documento fixo,
--    preenchidos a partir do pedido mas editáveis)
--  • segunda coluna "Quant." nas linhas (items[].qty2, opcional)
-- Pré-requisito: 010_folha_orcamento_notas_obra.sql
-- ════════════════════════════════════════════════════════════════════
alter table public.quote_sheets
  add column is_quote       boolean not null default true,   -- caixa "Orçamento"
  add column is_order       boolean not null default false,  -- caixa "Nota encomenda"
  add column delivery       text not null default '' check (char_length(delivery) <= 120),
  add column client_name    text not null default '' check (char_length(client_name) <= 200),
  add column client_address text not null default '' check (char_length(client_address) <= 300),
  add column client_phone   text not null default '' check (char_length(client_phone) <= 40),
  add column client_nif     text not null default '' check (char_length(client_nif) <= 20),
  add constraint quote_sheets_type_check check (is_quote or is_order);

grant insert (is_quote, is_order, delivery, client_name, client_address, client_phone, client_nif),
      update (is_quote, is_order, delivery, client_name, client_address, client_phone, client_nif)
  on public.quote_sheets to authenticated;
