-- =============================================================================
-- Returned sets free their budget immediately (2026-11-18)
-- Owner decision: a set stops counting against the monthly € budget as soon as
-- it is returned, instead of at the next billing period / monthly anniversary.
--
-- Rollback: restore public.used_credits from
-- 20261105225000_annual_budget_monthly_window.sql.
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
   where o.subscriber_id = p_subscriber_id
     and o.status <> 'returned';
$$;
