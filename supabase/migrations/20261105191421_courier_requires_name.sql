-- =============================================================================
-- Courier rentals need a receiver name (2026-11-05)
-- The courier label is addressed to delivery_name, but the order insert
-- trigger only required phone and address, so an empty profile name created
-- a courier order LP Express can't label. The name is now required too.
--
-- Rollback: restore guard_member_order_insert from
-- 20261105190211_mega_courier_rentals.sql.
-- =============================================================================

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

  -- Legenda (mega) includes door delivery without the paid add-on.
  if new.home_delivery and v_sub.home_delivery is not true
     and v_sub.plan is distinct from 'mega'::public.plan_tier then
    raise exception 'Home delivery is not enabled for this subscription'
      using errcode = '42501';
  end if;

  if new.home_delivery and (
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
