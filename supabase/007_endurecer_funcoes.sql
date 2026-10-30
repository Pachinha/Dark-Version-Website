-- ════════════════════════════════════════════════════════════════════
-- Lareiras Pachinha — 007: endurecer funções (avisos do Supabase Security Advisor)
--  • funções de gatilho (triggers) deixam de poder ser chamadas pela API
--  • funções auxiliares das políticas só para utilizadores com sessão
--  • search_path fixo nas funções que não o tinham
-- Pré-requisito: 006_referencia_pedido.sql
-- ════════════════════════════════════════════════════════════════════

-- Gatilhos: correm sozinhos na base de dados, ninguém os chama pela API.
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.log_change()               from public, anon, authenticated;
revoke execute on function public.guard_jobs_staff()         from public, anon, authenticated;
revoke execute on function public.guard_maintenance_staff()  from public, anon, authenticated;
revoke execute on function public.touch_updated_at()         from public, anon, authenticated;

-- Auxiliares usadas nas políticas (só para quem tem sessão iniciada).
revoke execute on function public.is_admin()                  from public, anon;
revoke execute on function public.is_staff()                  from public, anon;
revoke execute on function public.is_technician_session()     from public, anon;
revoke execute on function public.is_assigned_client(uuid)    from public, anon;
revoke execute on function public.is_assigned_address(uuid)   from public, anon;
grant  execute on function public.is_admin()                  to authenticated;
grant  execute on function public.is_staff()                  to authenticated;
grant  execute on function public.is_technician_session()     to authenticated;
grant  execute on function public.is_assigned_client(uuid)    to authenticated;
grant  execute on function public.is_assigned_address(uuid)   to authenticated;

alter function public.mfa_ok()           set search_path = '';
alter function public.touch_updated_at() set search_path = '';
