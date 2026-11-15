-- =============================================================================
-- Paid courier for rentals on every plan (2026-11-15)
-- A member whose plan has no door-delivery item can still rent with courier
-- delivery by paying a one-off fee in Stripe Checkout. The member can't insert
-- such an order directly (the guard still refuses it); the stripe-webhook
-- creates it through record_paid_courier_rental once the fee is paid.
--
-- The member rental rules move out of guard_member_order_insert into
-- apply_member_rental_rules so the guard and the paid path check the same
-- things (status, pause, cancellation, tier, budget, address).
--
-- Builds on 20261106011500_subscriber_default_terminal.sql (subscribers
-- lp_terminal_id / lp_terminal_name).
--
-- Rollback: restore guard_member_order_insert from
-- 20261106011500_subscriber_default_terminal.sql, drop
-- record_paid_courier_rental and apply_member_rental_rules, and drop
-- orders.stripe_session_id.
-- =============================================================================

alter table public.orders
  add column if not exists stripe_session_id text unique;

comment on column public.orders.stripe_session_id is
  'Stripe Checkout session that paid this rental''s courier fee; null when nothing was paid.';

-- Checks a member rental and fills the server-owned columns. With
-- p_is_courier_paid the courier fee was paid for this order, so courier
-- delivery is allowed without the plan's door-delivery item.
create or replace function public.apply_member_rental_rules(
  p_order public.orders,
  p_is_courier_paid boolean
)
returns public.orders
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders := p_order;
  v_sub record;
  v_allowed_tiers public.plan_tier[];
  v_product_value numeric;
  v_credits integer;
  v_used numeric;
begin
  -- Serialises concurrent checkouts by the same member so two inserts can't
  -- both fit into the same remaining budget.
  perform pg_advisory_xact_lock(hashtextextended(v_order.subscriber_id::text, 0));

  select plan, status, home_delivery, cancel_at, paused_until,
         name, last_name, phone, street, house_no, flat, city, postal_code,
         lp_terminal_id, lp_terminal_name
    into v_sub
  from public.subscribers
  where id = v_order.subscriber_id;

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
  where id = v_order.product_id;

  if v_allowed_tiers is null or not (v_sub.plan = any (v_allowed_tiers)) then
    raise exception 'Plan % does not include product %', v_sub.plan, v_order.product_id
      using errcode = '42501';
  end if;

  select credits into v_credits
  from public.plans
  where id = v_sub.plan;

  -- Same rule as useCredits: see public.used_credits.
  v_used := public.used_credits(v_order.subscriber_id);

  if v_used + coalesce(v_product_value, 0) > coalesce(v_credits, 0) then
    raise exception 'Product % exceeds the plan budget', v_order.product_id
      using errcode = 'check_violation';
  end if;

  -- Legenda (mega) includes door delivery; other plans need the monthly
  -- add-on or a paid courier fee for this order.
  if v_order.home_delivery and not p_is_courier_paid
     and v_sub.home_delivery is not true
     and v_sub.plan is distinct from 'mega'::public.plan_tier then
    raise exception 'Home delivery is not enabled for this subscription'
      using errcode = '42501';
  end if;

  if v_order.home_delivery and (
       nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), '') is null
    or nullif(trim(v_sub.phone), '') is null
    or nullif(trim(v_sub.street), '') is null
    or nullif(trim(v_sub.house_no), '') is null
    or nullif(trim(v_sub.city), '') is null
    or nullif(trim(v_sub.postal_code), '') is null
  ) then
    raise exception 'Home delivery needs a name, phone and full address'
      using errcode = 'check_violation';
  end if;

  v_order.delivery_name := nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), '');
  v_order.delivery_phone := v_sub.phone;
  if v_order.home_delivery then
    v_order.delivery_street := v_sub.street;
    v_order.delivery_house_no := v_sub.house_no;
    v_order.delivery_flat := v_sub.flat;
    v_order.delivery_city := v_sub.city;
    v_order.delivery_postal_code := v_sub.postal_code;
    v_order.lp_terminal_id := null;
    v_order.lp_terminal_name := null;
  else
    v_order.delivery_street := null;
    v_order.delivery_house_no := null;
    v_order.delivery_flat := null;
    v_order.delivery_city := null;
    v_order.delivery_postal_code := null;
    v_order.lp_terminal_id := coalesce(v_order.lp_terminal_id, v_sub.lp_terminal_id);
    v_order.lp_terminal_name := coalesce(v_order.lp_terminal_name, v_sub.lp_terminal_name);
  end if;

  v_order.amount := 0;
  v_order.stripe_session_id := null;
  v_order.status := 'processing';
  v_order.start_date := current_date;
  v_order.due_date := current_date + 30;
  -- Shipping, return and timestamp columns are written by admins and the
  -- lpexpress edge functions; a member only picks the product and delivery.
  v_order.return_note := null;
  v_order.return_requested_at := null;
  v_order.lp_parcel_id := null;
  v_order.lp_barcode := null;
  v_order.lp_tracking_state := null;
  v_order.lp_label_created_at := null;
  v_order.lp_return_terminal_id := null;
  v_order.lp_return_parcel_id := null;
  v_order.lp_return_barcode := null;
  v_order.lp_return_tracking_state := null;
  v_order.lp_return_label_created_at := null;
  v_order.created_at := now();
  v_order.updated_at := now();

  return v_order;
end;
$$;

create or replace function public.guard_member_order_insert()
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

  return public.apply_member_rental_rules(new, false);
end;
$$;

-- Creates the courier rental a member paid for. Idempotent per Stripe
-- session, so a retried webhook returns the order it already made. With
-- p_dry_run nothing is written: create-rental-courier-checkout uses it to
-- refuse a payment for a rental that would be rejected anyway.
create or replace function public.record_paid_courier_rental(
  p_subscriber_id uuid,
  p_product_id integer,
  p_stripe_session_id text,
  p_amount numeric,
  p_dry_run boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_id uuid;
begin
  if not p_dry_run then
    select id into v_id
    from public.orders
    where stripe_session_id = p_stripe_session_id;
    if found then
      return v_id;
    end if;
  end if;

  v_order.subscriber_id := p_subscriber_id;
  v_order.product_id := p_product_id;
  v_order.home_delivery := true;
  v_order := public.apply_member_rental_rules(v_order, true);

  if p_dry_run then
    -- The insert's own stock trigger (assert_product_available) covers the
    -- real run; the dry run checks the same count without locking.
    if exists (
      select 1 from public.product_availability
      where product_id = p_product_id and available < 1
    ) then
      raise exception 'Product % is fully rented out', p_product_id
        using errcode = 'check_violation';
    end if;
    return null;
  end if;

  insert into public.orders (
    subscriber_id, product_id, amount, start_date, due_date, status,
    home_delivery, lp_terminal_id, lp_terminal_name,
    delivery_name, delivery_phone, delivery_street, delivery_house_no,
    delivery_flat, delivery_city, delivery_postal_code, stripe_session_id
  ) values (
    v_order.subscriber_id, v_order.product_id, p_amount, v_order.start_date,
    v_order.due_date, v_order.status, true, null, null,
    v_order.delivery_name, v_order.delivery_phone, v_order.delivery_street,
    v_order.delivery_house_no, v_order.delivery_flat, v_order.delivery_city,
    v_order.delivery_postal_code, p_stripe_session_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_paid_courier_rental(uuid, integer, text, numeric, boolean)
  from public, anon, authenticated;
grant execute on function public.record_paid_courier_rental(uuid, integer, text, numeric, boolean)
  to service_role;
