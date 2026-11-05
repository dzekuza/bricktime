-- =============================================================================
-- Atomic pause start (2026-11-05)
-- pause-subscription checked for held sets and then set paused_until, so a
-- rental inserted in between could start while billing was paused.
-- begin_subscription_pause takes the same per-member advisory lock as
-- guard_member_order_insert, re-checks held sets under it, and sets
-- paused_until in one transaction. The edge function calls it before Stripe
-- and clears paused_until again if the Stripe update fails.
--
-- Rollback: drop function public.begin_subscription_pause(uuid, timestamptz);
-- =============================================================================

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

  update public.subscribers
     set paused_until = p_until
   where id = p_subscriber;

  return true;
end;
$$;

revoke all on function public.begin_subscription_pause(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.begin_subscription_pause(uuid, timestamptz) to service_role;
