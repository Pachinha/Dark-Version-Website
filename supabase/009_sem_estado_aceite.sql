-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 009: pedido de orçamento sem o estado "aceite"
-- "Aceite" induzia em erro (parecia que devia aparecer na agenda). Se o cliente
-- não concordar com a marcação, responde à mensagem; a confirmação pelo próprio
-- cliente poderá ser automatizada mais tarde.
-- Pré-requisito: 008_morada_partilha_comentarios.sql
-- ════════════════════════════════════════════════════════════════════
update public.quote_requests set status = 'orcamento_enviado' where status = 'aceite';

alter table public.quote_requests drop constraint quote_requests_status_check;
alter table public.quote_requests add constraint quote_requests_status_check check (status in (
  'novo', 'visita_marcada', 'visita_feita', 'orcamento_enviado', 'recusado', 'cancelado'));
