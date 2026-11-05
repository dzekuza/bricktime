-- =============================================================================
-- Budget frees at the next billing period; pause support (2026-11-05)
-- A returned set used to free its budget at once, so a member could rent,
-- return after a week and rent again. Budget used in a billing period now
-- stays used until the next period starts (anchor: Stripe current_period_start,
-- written by stripe-webhook), via one function shared by the order insert
-- trigger and the storefront (useCredits RPC).
-- Also adds subscribers.paused_until for subscription pause, blocks rentals
-- while paused, and makes the three new subscriber columns member-read-only.
--
-- Rollback: restore guard_member_order_insert from
-- 20261105183814_orders_delivery_snapshot.sql and
-- guard_subscriber_billing_columns from 20261021120000; remove
-- used_credits(uuid) and the three subscriber columns.
-- =============================================================================

alter table public.subscribers
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end   timestamptz,
  add column if not exists paused_until         timestamptz;

comment on column public.subscribers.current_period_start is
  'Start of the current Stripe billing period; budget used by a set rented in this period stays used until it ends.';
comment on column public.subscribers.paused_until is
  'Billing paused (Stripe pause_collection) until this time; no new rentals while set.';

-- Budget used = Σ products.value over sets still held, plus sets already
-- returned but rented in the current billing period: a return frees budget
-- only when the next period starts. Without a stored period (not yet synced
-- from Stripe) only held sets count, as before.
-- Security invoker: a member's RLS limits it to their own orders.
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
         and o.start_date >= (s.current_period_start at time zone 'Europe/Vilnius')::date
       )
     );
$$;

revoke all on function public.used_credits(uuid) from public, anon;
grant execute on function public.used_credits(uuid) to authenticated, service_role;

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
      or new.current_period_start is not null
      or new.current_period_end is not null
      or new.paused_until is not null
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
    or new.current_period_start is distinct from old.current_period_start
    or new.current_period_end is distinct from old.current_period_end
    or new.paused_until is distinct from old.paused_until
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

create or replace function public.guard_member_order_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sub record;
  v_allowed_tiers public.plan_tier[];
  v_product_value numeric;
  v_credits integer;
  v_used numeric;
begin
  if current_user not in ('anon', 'authenticated')
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  then
    return new;
  end if;

  -- Serialises concurrent checkouts by the same member so two inserts can't
  -- both fit into the same remaining budget.
  perform pg_advisory_xact_lock(hashtextextended(new.subscriber_id::text, 0));

  select plan, status, home_delivery, cancel_at, paused_until,
         name, last_name, phone, street, house_no, flat, city, postal_code
    into v_sub
  from public.subscribers
  where id = new.subscriber_id;

  if not found or v_sub.status is distinct from 'active'::public.subscriber_status then
    raise exception 'An active subscription is required to rent'
      using errcode = '42501';
  end if;

  if v_sub.paused_until is not null and v_sub.paused_until > now() then
    raise exception 'Subscription is paused'
      using errcode = '42501';
  end if;

  -- Mirrors CANCELLATION_GRACE_DAYS in Checkout.tsx: a member whose plan ends
  -- within 14 days can't start a new 30-day rental.
  if v_sub.cancel_at is not null and v_sub.cancel_at < now() + interval '14 days' then
    raise exception 'Subscription ends too soon to start a rental'
      using errcode = '42501';
  end if;

  select allowed_tiers, value into v_allowed_tiers, v_product_value
  from public.products
  where id = new.product_id;

  if v_allowed_tiers is null or not (v_sub.plan = any (v_allowed_tiers)) then
    raise exception 'Plan % does not include product %', v_sub.plan, new.product_id
      using errcode = '42501';
  end if;

  select credits into v_credits
  from public.plans
  where id = v_sub.plan;

  -- Same rule as useCredits: see public.used_credits.
  v_used := public.used_credits(new.subscriber_id);

  if v_used + coalesce(v_product_value, 0) > coalesce(v_credits, 0) then
    raise exception 'Product % exceeds the plan budget', new.product_id
      using errcode = 'check_violation';
  end if;

  if new.home_delivery and v_sub.home_delivery is not true then
    raise exception 'Home delivery is not enabled for this subscription'
      using errcode = '42501';
  end if;

  if new.home_delivery and (
       nullif(trim(v_sub.phone), '') is null
    or nullif(trim(v_sub.street), '') is null
    or nullif(trim(v_sub.house_no), '') is null
    or nullif(trim(v_sub.city), '') is null
    or nullif(trim(v_sub.postal_code), '') is null
  ) then
    raise exception 'Home delivery needs a full address and phone'
      using errcode = 'check_violation';
  end if;

  new.delivery_name := nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), '');
  new.delivery_phone := v_sub.phone;
  if new.home_delivery then
    new.delivery_street := v_sub.street;
    new.delivery_house_no := v_sub.house_no;
    new.delivery_flat := v_sub.flat;
    new.delivery_city := v_sub.city;
    new.delivery_postal_code := v_sub.postal_code;
  else
    new.delivery_street := null;
    new.delivery_house_no := null;
    new.delivery_flat := null;
    new.delivery_city := null;
    new.delivery_postal_code := null;
  end if;

  new.amount := 0;
  new.status := 'processing';
  new.start_date := current_date;
  new.due_date := current_date + 30;
  -- Shipping, return and timestamp columns are written by admins and the
  -- lpexpress edge functions; a member only picks the product and delivery.
  new.return_note := null;
  new.return_requested_at := null;
  new.lp_parcel_id := null;
  new.lp_barcode := null;
  new.lp_tracking_state := null;
  new.lp_label_created_at := null;
  new.lp_return_terminal_id := null;
  new.lp_return_parcel_id := null;
  new.lp_return_barcode := null;
  new.lp_return_tracking_state := null;
  new.lp_return_label_created_at := null;
  new.created_at := now();
  new.updated_at := now();

  return new;
end;
$$;
