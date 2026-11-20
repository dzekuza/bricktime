-- Review fixes for 20261120150100_mystery_box_requests.sql.
--  * record_paid_mystery_courier: the session-id lookup now runs inside the
--    advisory lock. Before, a duplicate webhook delivery could miss the order
--    the first delivery was inserting, hit the "already requested" rule and
--    get a valid payment refunded.
--  * request_mystery_box: a locker needs both id and name, or the order can't
--    be shipped through the admin flow.
--
-- Rollback: restore both functions from 20261120150100_mystery_box_requests.sql.

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

  -- An explicit choice wins; otherwise the saved locker, which must be complete.
  if nullif(trim(p_terminal_id), '') is not null then
    v_terminal_id := trim(p_terminal_id);
    v_terminal_name := nullif(trim(p_terminal_name), '');
  else
    v_terminal_id := v_sub.lp_terminal_id;
    v_terminal_name := v_sub.lp_terminal_name;
  end if;
  if v_terminal_id is null or v_terminal_name is null then
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
  perform pg_advisory_xact_lock(hashtextextended(p_subscriber_id::text, 0));

  if not p_dry_run then
    select id into v_id from public.orders where stripe_session_id = p_stripe_session_id;
    if found then
      return v_id;
    end if;
  end if;

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
