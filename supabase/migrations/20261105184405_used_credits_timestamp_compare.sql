-- =============================================================================
-- used_credits: compare timestamps, not dates (2026-11-05)
-- 20261105184103 compared orders.start_date (UTC current_date) with
-- current_period_start converted to a Vilnius date, so a set rented just
-- after local midnight on the first day of a period fell outside it and its
-- budget freed on return. created_at is set to now() by the member insert
-- trigger, so comparing it with current_period_start directly is exact.
--
-- Rollback: restore used_credits from 20261105184103_budget_period_and_pause.sql.
-- =============================================================================

create or replace function public.used_credits(p_subscriber_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(p.value), 0)
    from public.orders o
    join public.products p on p.id = o.product_id
    left join public.subscribers s on s.id = o.subscriber_id
   where o.subscriber_id = p_subscriber_id
     and (
       o.status <> 'returned'
       or (
         s.current_period_start is not null
         and o.created_at >= s.current_period_start
       )
     );
$$;
