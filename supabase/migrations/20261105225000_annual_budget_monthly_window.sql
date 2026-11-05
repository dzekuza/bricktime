-- =============================================================================
-- Monthly budget window for annual subscriptions (2026-11-05)
-- Stripe sets current_period_start..current_period_end to the full 12-month
-- billing cycle on annual plans (> 40 days). Returned sets should free on each
-- monthly anniversary of current_period_start rather than locking the member's
-- budget for the rest of the year.
--
-- Rollback: restore public.used_credits from
-- 20261105190551_budget_fallback_and_pause_reentry.sql.
-- =============================================================================

create or replace function public.used_credits(p_subscriber_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  with budget_window as (
    select s.id as subscriber_id,
           case
             when s.current_period_start is null then now() - interval '1 month'
             when s.current_period_end is not null
              and s.current_period_end - s.current_period_start > interval '40 days' then coalesce(
               (
                 select max(step_start)
                   from generate_series(0, 11) as m
                  cross join lateral (
                    select ((s.current_period_start at time zone 'UTC') + make_interval(months => m)) at time zone 'UTC' as step_start
                  ) step
                  where step_start <= now()
               ),
               s.current_period_start
             )
             else s.current_period_start
           end as period_start
      from public.subscribers s
     where s.id = p_subscriber_id
  )
  select coalesce(sum(p.value), 0)
    from public.orders o
    join public.products p on p.id = o.product_id
    left join budget_window bw on bw.subscriber_id = o.subscriber_id
   where o.subscriber_id = p_subscriber_id
     and (
       o.status <> 'returned'
       or o.created_at >= coalesce(bw.period_start, now() - interval '1 month')
     );
$$;
