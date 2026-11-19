-- =============================================================================
-- Link the rentals of one cart (2026-11-19)
-- A cart of several sets creates one order per set (each has its own status,
-- due date, return and tracking). Orders created together now share a cart_id,
-- so the admin can show them as one cart and ship them in one parcel.
--
-- Only carts of two or more sets get an id; a single set stays unlinked.
-- Orders placed before this change have no cart_id and stay ungrouped.
-- cart_id is a grouping label only: nothing authorises anything by it, and the
-- admin groups by cart_id AND customer.
--
-- Rollback: re-run the claim_rentals and record_paid_courier_rentals
-- definitions from 20261119180000_cart_review_fixes.sql, then
--   alter table public.orders drop column cart_id;
-- =============================================================================

alter table public.orders add column if not exists cart_id uuid;

comment on column public.orders.cart_id is
  'Shared by the orders created together from one set cart (two or more sets); null otherwise.';

create or replace function public.claim_rentals(
  p_product_ids   integer[],
  p_home_delivery boolean default false,
  p_terminal_id   text default null,
  p_terminal_name text default null
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_member uuid := auth.uid();
  v_ids    integer[];
  v_id     integer;
  v_cart   uuid;
begin
  if v_member is null then
    raise exception 'Sign in to rent' using errcode = '42501';
  end if;

  if cardinality(coalesce(p_product_ids, '{}')) not between 1 and 10 then
    raise exception 'Choose between 1 and 10 sets' using errcode = 'check_violation';
  end if;

  select array_agg(distinct x order by x) into v_ids
    from unnest(p_product_ids) as x;

  if not coalesce(p_home_delivery, false)
     and (nullif(trim(p_terminal_id), '') is null or nullif(trim(p_terminal_name), '') is null) then
    raise exception 'Choose a parcel terminal' using errcode = 'check_violation';
  end if;

  if array_length(v_ids, 1) > 1 then
    v_cart := gen_random_uuid();
  end if;

  -- Same key as apply_member_rental_rules; taken before any product row is.
  perform pg_advisory_xact_lock(hashtextextended(v_member::text, 0));

  foreach v_id in array v_ids loop
    insert into public.orders (
      subscriber_id, product_id, amount, start_date, due_date, status,
      home_delivery, lp_terminal_id, lp_terminal_name, cart_id
    ) values (
      v_member, v_id, 0, current_date, current_date + 30, 'processing',
      coalesce(p_home_delivery, false),
      case when coalesce(p_home_delivery, false) then null else p_terminal_id end,
      case when coalesce(p_home_delivery, false) then null else p_terminal_name end,
      v_cart
    );
  end loop;
end;
$$;

revoke all on function public.claim_rentals(integer[], boolean, text, text) from public, anon;
grant execute on function public.claim_rentals(integer[], boolean, text, text) to authenticated;

create or replace function public.record_paid_courier_rentals(
  p_subscriber_id uuid,
  p_product_ids integer[],
  p_stripe_session_id text,
  p_amount numeric,
  p_dry_run boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids     integer[];
  v_id      integer;
  v_order   public.orders;
  v_count   integer := 0;
  v_credits integer;
  v_total   numeric;
  v_plan    public.plan_tier;
  v_cart    uuid;
begin
  if cardinality(coalesce(p_product_ids, '{}')) not between 1 and 10 then
    raise exception 'Choose between 1 and 10 sets' using errcode = 'check_violation';
  end if;

  select array_agg(distinct x order by x) into v_ids
    from unnest(p_product_ids) as x;

  -- Same key as apply_member_rental_rules; taken before any product row is.
  perform pg_advisory_xact_lock(hashtextextended(p_subscriber_id::text, 0));

  if not p_dry_run then
    if exists (
      select 1 from public.orders where stripe_session_id = p_stripe_session_id
    ) then
      return 0;
    end if;
  end if;

  if p_dry_run then
    foreach v_id in array v_ids loop
      v_order := null;
      v_order.subscriber_id := p_subscriber_id;
      v_order.product_id := v_id;
      v_order.home_delivery := true;
      perform public.apply_member_rental_rules(v_order, true);

      if exists (
        select 1 from public.product_availability
        where product_id = v_id and available < 1
      ) then
        raise exception 'Product % is fully rented out', v_id
          using errcode = 'check_violation';
      end if;
    end loop;

    select plan into v_plan from public.subscribers where id = p_subscriber_id;
    select credits into v_credits from public.plans where id = v_plan;
    select coalesce(sum(value), 0) into v_total
      from public.products where id = any (v_ids);

    if public.used_credits(p_subscriber_id) + v_total > coalesce(v_credits, 0) then
      raise exception 'Cart exceeds the plan budget'
        using errcode = 'check_violation';
    end if;

    return array_length(v_ids, 1);
  end if;

  if array_length(v_ids, 1) > 1 then
    v_cart := gen_random_uuid();
  end if;

  foreach v_id in array v_ids loop
    v_order := null;
    v_order.subscriber_id := p_subscriber_id;
    v_order.product_id := v_id;
    v_order.home_delivery := true;
    v_order := public.apply_member_rental_rules(v_order, true);

    insert into public.orders (
      subscriber_id, product_id, amount, start_date, due_date, status,
      home_delivery, lp_terminal_id, lp_terminal_name,
      delivery_name, delivery_phone, delivery_street, delivery_house_no,
      delivery_flat, delivery_city, delivery_postal_code, stripe_session_id,
      cart_id
    ) values (
      v_order.subscriber_id, v_order.product_id,
      case when v_count = 0 then p_amount else 0 end,
      v_order.start_date, v_order.due_date, v_order.status, true, null, null,
      v_order.delivery_name, v_order.delivery_phone, v_order.delivery_street,
      v_order.delivery_house_no, v_order.delivery_flat, v_order.delivery_city,
      v_order.delivery_postal_code,
      case when v_count = 0 then p_stripe_session_id end,
      v_cart
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.record_paid_courier_rentals(uuid, integer[], text, numeric, boolean)
  from public, anon, authenticated;
grant execute on function public.record_paid_courier_rentals(uuid, integer[], text, numeric, boolean)
  to service_role;
