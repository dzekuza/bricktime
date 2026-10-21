-- Checkout inserts orders straight from the browser, and rental eligibility
-- (active plan, tier, Briksiai budget, cancellation grace, door delivery) was
-- only checked in the UI. Any member could rent a set their plan doesn't allow,
-- over budget, without a subscription, or pick door delivery without paying
-- for it -- and choose their own amount/status/dates.
--
-- Same shape as guard_subscriber_billing_columns(): a trigger, because admins
-- share the `authenticated` role with members. Server roles (service_role
-- edge functions) and admins are not restricted.
--
-- Invoker rights on purpose: every row read here is one RLS already lets the
-- member see (own subscriber row, own orders, public plans/products), and
-- current_user must stay the caller's role for the member check to work.
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
  v_price numeric;
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

  select plan, status, home_delivery, cancel_at into v_sub
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

  select credits, price into v_credits, v_price
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

  new.amount := v_price;
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

create trigger orders_guard_member_insert
  before insert on public.orders
  for each row execute function public.guard_member_order_insert();

-- NOTE: rollback is `drop trigger orders_guard_member_insert on public.orders;
-- drop function public.guard_member_order_insert();`
