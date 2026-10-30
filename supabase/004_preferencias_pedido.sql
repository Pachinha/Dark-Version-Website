-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 004: preferências de horário nos pedidos
-- O cliente já não escolhe a data: faz um pedido e indica quando lhe dá
-- mais jeito. O secretariado marca a visita com base nessas preferências.
-- Pré-requisito: 003_seguranca.sql
-- ════════════════════════════════════════════════════════════════════

alter table public.maintenance_requests
  -- Combinações dia-período, ex.: {seg-manha, qua-tarde}. Vazio = qualquer altura.
  add column availability text[] not null default '{}' check (availability <@ array[
    'seg-manha', 'seg-tarde', 'ter-manha', 'ter-tarde', 'qua-manha', 'qua-tarde',
    'qui-manha', 'qui-tarde', 'sex-manha', 'sex-tarde'
  ]::text[]),
  add column urgency text not null default 'normal' check (urgency in ('flexivel', 'normal', 'urgente')),
  add column contact_preference text not null default 'telefone'
    check (contact_preference in ('telefone', 'whatsapp', 'email'));

comment on column public.maintenance_requests.preferred_date is
  'Disponível a partir desta data (preferência do cliente, não é marcação)';

grant insert (availability, urgency, contact_preference) on public.maintenance_requests to authenticated;
