-- =============================================================================
-- Budget fallback and pause re-entry (2026-11-05)
-- 1. used_credits: a subscriber with no current_period_start yet (not synced
--    since stripe-webhook started storing it) freed returned sets at once.
--    Until the first sync, a returned set counts if it was rented in the last
--    month.
-- 2. begin_subscription_pause: a second call while a pause is already set
--    returned true and overwrote paused_until. It now claims the pause only
--    when none is in force, under the same advisory lock.
--
-- Rollback: restore used_credits from
-- 20261105184405_used_credits_timestamp_compare.sql and
-- begin_subscription_pause from 20261105184830_begin_subscription_pause.sql.
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
       or (
         s.current_period_start is null
         and o.created_at >= now() - interval '1 month'
       )
     );
$$;

create or replace function public.begin_subscription_pause(p_subscriber uuid, p_until timestamptz)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Same lock as guard_member_order_insert, so a rental can't land between
  -- the held-sets check and setting paused_until.
  perform pg_advisory_xact_lock(hashtextextended(p_subscriber::text, 0));

  if public.held_brick_value(p_subscriber) > 0 then
    return false;
  end if;

  -- Only one pause at a time: a second request must not overwrite it.
  update public.subscribers
     set paused_until = p_until
   where id = p_subscriber
     and (paused_until is null or paused_until <= now());

  return found;
end;
$$;
