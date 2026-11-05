-- =============================================================================
-- Orders: delivery details snapshot (2026-11-05)
-- A courier rental stored no address, so admins couldn't create the LP
-- Express label ("the customer's address isn't stored"). The member insert
-- trigger now copies name, phone and address from the subscriber profile
-- onto the order, so a later profile edit can't change where a shipped order
-- goes, and refuses a courier rental without a full address.
-- It also stops writing the plan's list price into orders.amount: a rental
-- has no charge of its own (the subscription pays), so amount is 0.
--
-- Rollback: alter table public.orders drop column delivery_name, ... (the
-- seven delivery_* columns); restore guard_member_order_insert from
-- 20261021171335_guard_member_order_inserts.sql.
-- =============================================================================

alter table public.orders
  add column if not exists delivery_name        text,
  add column if not exists delivery_phone       text,
  add column if not exists delivery_street      text,
  add column if not exists delivery_house_no    text,
  add column if not exists delivery_flat        text,
  add column if not exists delivery_city        text,
  add column if not exists delivery_postal_code text;

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

  select plan, status, home_delivery, cancel_at,
         name, last_name, phone, street, house_no, flat, city, postal_code
    into v_sub
  from public.subscribers
  where id = new.subscriber_id;

  if not found or v_sub.status is distinct from 'active'::public.subscriber_status then
    raise exception 'An active subscription is required to rent'
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

  -- Budget is Σ products.value over non-returned orders, as useCredits computes it.
  select coalesce(sum(p.value), 0) into v_used
  from public.orders o
  join public.products p on p.id = o.product_id
  where o.subscriber_id = new.subscriber_id
    and o.status <> 'returned';

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
