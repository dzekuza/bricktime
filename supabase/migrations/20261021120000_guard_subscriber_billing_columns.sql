-- Members could update every column of their own subscribers row from the
-- browser, including plan/status (a free subscription), home_delivery (door
-- delivery without the fee) and penalty_amount (clearing a penalty). Billing
-- columns are now written only by server roles (Stripe webhook, edge
-- functions) and admins.
--
-- A trigger rather than column REVOKEs: admins use the same `authenticated`
-- role as members, so a grant can't tell them apart.
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

create trigger subscribers_guard_billing_columns
  before insert or update on public.subscribers
  for each row execute function public.guard_subscriber_billing_columns();

-- Members could also mark their own penalty records as paid. The Stripe
-- webhook now resolves them, so only admins update this table.
drop policy subscriber_penalties_update on public.subscriber_penalties;
create policy subscriber_penalties_update on public.subscriber_penalties
  for update
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- NOTE: rollback is `drop trigger subscribers_guard_billing_columns on
-- public.subscribers; drop function public.guard_subscriber_billing_columns();`
-- and restoring the previous subscriber_penalties_update policy (owner by
-- auth.email() = subscriber_email, or admin).
