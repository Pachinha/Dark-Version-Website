-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 006: número de referência do pedido de orçamento
-- (aparece no comprovativo, no email ao cliente e no backoffice: PCH-00042)
-- Pré-requisito: 005_pedido_orcamento.sql
-- Executar uma vez: Supabase → SQL Editor → New snippet → colar → Run
-- ════════════════════════════════════════════════════════════════════

alter table public.quote_requests add column ref integer generated always as identity;
create unique index on public.quote_requests (ref);
