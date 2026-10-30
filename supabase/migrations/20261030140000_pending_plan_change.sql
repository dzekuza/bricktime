-- Scheduled plan downgrades and held-set-aware cancellation.
--   * A downgrade is accepted as a request (pending_plan) and applied at the next
--     renewal by a Stripe subscription schedule, only while the sets a member
--     holds fit the new plan's credits.
--   * A cancellation waits (cancel_requested) until every set is returned.
-- Members can't write any of these columns; edge functions (service role) do.
-- Rollback: drop the function and columns below, then re-create
-- guard_subscriber_billing_columns() from its previous definition (without the
-- pending_* / cancel_requested checks).

alter table public.subscribers
  add column if not exists pending_plan public.plan_tier,
  add column if not exists pending_home_delivery boolean,
  add column if not exists pending_schedule_id text,
  add column if not exists cancel_requested boolean not null default false;

-- Total credit value of the sets a member still holds, computed the same way as
-- guard_member_order_insert() so both agree on what "fits".
create or replace function public.held_brick_value(p_subscriber uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(p.value), 0)
  from public.orders o
  join public.products p on p.id = o.product_id
  where o.subscriber_id = p_subscriber
    and o.status <> 'returned';
$$;

revoke execute on function public.held_brick_value(uuid) from public, anon, authenticated;

create or replace function public.guard_subscriber_billing_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated')
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.plan is distinct from 'nano'::public.plan_tier
      or new.status is distinct from 'paused'::public.subscriber_status
      or new.penalty_amount is not null
      or new.penalty_reason is not null
      or new.stripe_customer_id is not null
      or new.stripe_subscription_id is not null
      or new.home_delivery is true
      or new.cancel_at is not null
      or new.pending_plan is not null
      or new.pending_home_delivery is not null
      or new.pending_schedule_id is not null
      or new.cancel_requested is true
      or new.email is distinct from (select auth.jwt() ->> 'email')
    then
      raise exception 'subscribers billing columns are read-only for members'
        using errcode = '42501';
    end if;
  elsif new.plan is distinct from old.plan
    or new.status is distinct from old.status
    or new.penalty_amount is distinct from old.penalty_amount
    or new.penalty_reason is distinct from old.penalty_reason
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.home_delivery is distinct from old.home_delivery
    or new.cancel_at is distinct from old.cancel_at
    or new.pending_plan is distinct from old.pending_plan
    or new.pending_home_delivery is distinct from old.pending_home_delivery
    or new.pending_schedule_id is distinct from old.pending_schedule_id
    or new.cancel_requested is distinct from old.cancel_requested
    -- The webhook falls back to matching on email, so members may only sync it
    -- to their own auth address.
    or (
      new.email is distinct from old.email
      and new.email is distinct from (select auth.jwt() ->> 'email')
    )
  then
    raise exception 'subscribers billing columns are read-only for members'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
