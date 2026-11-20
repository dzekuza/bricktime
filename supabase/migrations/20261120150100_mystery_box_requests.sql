-- Customer-initiated Mystery Box requests (2026-11-20).
-- A request is an order with no set (product_id null, status 'requested');
-- admin assigns the set later. Locker requests are free (request_mystery_box),
-- courier requests are created by the webhook after the courier fee is paid
-- (record_paid_mystery_courier).
--
-- Rollback: drop functions record_paid_mystery_courier, request_mystery_box,
-- check_mystery_box_request, billing_window; restore assert_product_available
-- and its INSERT-only trigger from 20260904153644_product_availability_view_and_rental_guard.sql;
-- delete any orders with product_id null, then `alter table public.orders
-- alter column product_id set not null`. (The 'requested' enum value stays;
-- Postgres can't drop enum values.)

alter table public.orders alter column product_id drop not null;

-- Stock is checked when a set is attached: on insert as before, and now also
-- when an unassigned request gets its set (an UPDATE of product_id).
create or replace function public.assert_product_available()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
  v_rented integer;
begin
  if new.product_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.product_id is not distinct from new.product_id then
    return new;
  end if;

  -- Locks the product row so two checkouts for the last copy serialise instead
  -- of both reading the same free count.
  select stock into v_stock
  from public.products
  where id = new.product_id
  for update;

  if v_stock is null then
    raise exception 'Product % does not exist', new.product_id
      using errcode = 'foreign_key_violation';
  end if;

  select count(*) into v_rented
  from public.orders
  where product_id = new.product_id
    and status <> 'returned'
    and id is distinct from new.id;

  if v_rented >= v_stock then
    raise exception 'Product % is fully rented out', new.product_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_assert_product_available on public.orders;
create trigger orders_assert_product_available
  before insert or update of product_id on public.orders
  for each row execute function public.assert_product_available();

-- Current monthly window of a subscriber: starts at the latest monthly
-- anniversary of current_period_start (annual plans have a 12-month Stripe
-- period) and ends at the next one, or at current_period_end on monthly plans.
-- Same window as used_credits (20261105225000); drives the Mystery Box limit and countdown.
create or replace function public.billing_window(p_subscriber_id uuid)
returns table (window_start timestamptz, window_end timestamptz)
language sql
stable
set search_path = ''
as $$
  select
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
    end,
    case
      when s.current_period_start is not null
       and s.current_period_end is not null
       and s.current_period_end - s.current_period_start > interval '40 days' then coalesce(
        (
          select min(step_start)
            from generate_series(1, 12) as m
           cross join lateral (
             select ((s.current_period_start at time zone 'UTC') + make_interval(months => m)) at time zone 'UTC' as step_start
           ) step
           where step_start > now()
        ),
        s.current_period_end
      )
      else s.current_period_end
    end
  from public.subscribers s
  where s.id = p_subscriber_id;
$$;

grant execute on function public.billing_window(uuid) to authenticated;

-- Shared rule check for both request paths. Not callable by members directly:
-- only the security definer request functions below use it.
create or replace function public.check_mystery_box_request(p_subscriber_id uuid)
returns public.subscribers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.subscribers;
  v_window_start timestamptz;
begin
  select * into v_sub from public.subscribers where id = p_subscriber_id;

  if not found or v_sub.status is distinct from 'active'::public.subscriber_status then
    raise exception 'An active subscription is required to request a Mystery Box'
      using errcode = '42501';
  end if;

  if v_sub.plan::text not like 'mystery%' then
    raise exception 'Mystery Box requests need a Mystery Box plan'
      using errcode = '42501';
  end if;

  if v_sub.paused_until is not null and v_sub.paused_until > now() then
    raise exception 'Subscription is paused'
      using errcode = '42501';
  end if;

  if v_sub.cancel_at is not null and v_sub.cancel_at < now() + interval '14 days' then
    raise exception 'Subscription ends too soon to start a rental'
      using errcode = '42501';
  end if;

  -- The previous box has to be back (or still waiting for a set) first.
  if exists (
    select 1 from public.orders
    where subscriber_id = p_subscriber_id
      and is_mystery
      and status <> 'returned'
  ) then
    raise exception 'Return your current Mystery Box before requesting another'
      using errcode = 'check_violation';
  end if;

  select window_start into v_window_start from public.billing_window(p_subscriber_id);

  if exists (
    select 1 from public.orders
    where subscriber_id = p_subscriber_id
      and is_mystery
      and created_at >= coalesce(v_window_start, now() - interval '1 month')
  ) then
    raise exception 'A Mystery Box was already requested in this billing period'
      using errcode = 'check_violation';
  end if;

  return v_sub;
end;
$$;

revoke all on function public.check_mystery_box_request(uuid) from public, anon, authenticated;

-- Free request: delivery to a parcel locker.
create or replace function public.request_mystery_box(
  p_terminal_id text default null,
  p_terminal_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sub public.subscribers;
  v_terminal_id text;
  v_terminal_name text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Serialises double clicks so the once-per-period check can't be raced.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  v_sub := public.check_mystery_box_request(v_uid);

  v_terminal_id := coalesce(nullif(trim(p_terminal_id), ''), v_sub.lp_terminal_id);
  v_terminal_name := coalesce(nullif(trim(p_terminal_name), ''), v_sub.lp_terminal_name);
  if v_terminal_id is null then
    raise exception 'Choose a parcel locker for the delivery'
      using errcode = 'check_violation';
  end if;

  insert into public.orders (
    subscriber_id, product_id, amount, start_date, due_date, status,
    is_mystery, home_delivery, lp_terminal_id, lp_terminal_name,
    delivery_name, delivery_phone
  ) values (
    v_uid, null, 0, current_date, current_date + 30, 'requested',
    true, false, v_terminal_id, v_terminal_name,
    nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), ''), v_sub.phone
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.request_mystery_box(text, text) from public, anon;
grant execute on function public.request_mystery_box(text, text) to authenticated;

-- Paid request: door delivery. Called by stripe-webhook after the courier fee is
-- paid, so an unpaid checkout never creates a request. Idempotent per session.
create or replace function public.record_paid_mystery_courier(
  p_subscriber_id uuid,
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
  v_sub public.subscribers;
  v_id uuid;
begin
  if not p_dry_run then
    select id into v_id from public.orders where stripe_session_id = p_stripe_session_id;
    if found then
      return v_id;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_subscriber_id::text, 0));

  v_sub := public.check_mystery_box_request(p_subscriber_id);

  if nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), '') is null
     or nullif(trim(v_sub.phone), '') is null
     or nullif(trim(v_sub.street), '') is null
     or nullif(trim(v_sub.house_no), '') is null
     or nullif(trim(v_sub.city), '') is null
     or nullif(trim(v_sub.postal_code), '') is null then
    raise exception 'Home delivery needs a name, phone and full address'
      using errcode = 'check_violation';
  end if;

  if p_dry_run then
    return null;
  end if;

  insert into public.orders (
    subscriber_id, product_id, amount, start_date, due_date, status,
    is_mystery, home_delivery, delivery_name, delivery_phone,
    delivery_street, delivery_house_no, delivery_flat, delivery_city,
    delivery_postal_code, stripe_session_id
  ) values (
    p_subscriber_id, null, p_amount, current_date, current_date + 30, 'requested',
    true, true, nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), ''), v_sub.phone,
    v_sub.street, v_sub.house_no, v_sub.flat, v_sub.city,
    v_sub.postal_code, p_stripe_session_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_paid_mystery_courier(uuid, text, numeric, boolean) from public, anon, authenticated;
grant execute on function public.record_paid_mystery_courier(uuid, text, numeric, boolean) to service_role;
