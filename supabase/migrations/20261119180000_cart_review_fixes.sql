-- =============================================================================
-- Cart review fixes (2026-11-19)
-- 1. claim_rentals and record_paid_courier_rentals checked the ten-set limit
--    only after unnesting and de-duplicating the whole input, so an oversized
--    array did work before being refused. The array length is now checked first.
-- 2. Both took the member's advisory lock only inside each insert, after the
--    insert had already locked its product row. Two concurrent claims by the
--    same member could hold different product locks and wait on each other.
--    The member lock (same key as apply_member_rental_rules) is now taken
--    before the loop, so every claim by one member runs one after another.
-- 3. get_merch_order_lines_by_session handed the purchased lines to anyone
--    holding a session id, forever. It now follows get_merch_order_by_session:
--    the order's owner, or anyone within the first hour for a guest order.
--
-- Rollback: re-run the three definitions from 20261119150000_claim_rentals.sql,
-- 20261119170000_paid_courier_rental_cart.sql and 20261119100000_merch_cart_orders.sql.
-- =============================================================================

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

  -- Same key as apply_member_rental_rules; taken before any product row is.
  perform pg_advisory_xact_lock(hashtextextended(v_member::text, 0));

  foreach v_id in array v_ids loop
    insert into public.orders (
      subscriber_id, product_id, amount, start_date, due_date, status,
      home_delivery, lp_terminal_id, lp_terminal_name
    ) values (
      v_member, v_id, 0, current_date, current_date + 30, 'processing',
      coalesce(p_home_delivery, false),
      case when coalesce(p_home_delivery, false) then null else p_terminal_id end,
      case when coalesce(p_home_delivery, false) then null else p_terminal_name end
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
      delivery_flat, delivery_city, delivery_postal_code, stripe_session_id
    ) values (
      v_order.subscriber_id, v_order.product_id,
      case when v_count = 0 then p_amount else 0 end,
      v_order.start_date, v_order.due_date, v_order.status, true, null, null,
      v_order.delivery_name, v_order.delivery_phone, v_order.delivery_street,
      v_order.delivery_house_no, v_order.delivery_flat, v_order.delivery_city,
      v_order.delivery_postal_code,
      case when v_count = 0 then p_stripe_session_id end
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

create or replace function public.get_merch_order_lines_by_session(p_session_id text)
returns table (
  item_name  text,
  size       text,
  quantity   int,
  unit_price numeric,
  image_url  text,
  item_slug  text
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.item_name, l.size, l.quantity, l.unit_price, i.image_url, i.slug
    from public.merch_order_items l
    join public.merch_orders o on o.id = l.order_id
    left join public.merch_items i on i.id = l.merch_item_id
   where o.stripe_session_id = p_session_id
     and (
       (o.user_id is not null and o.user_id = (select auth.uid()))
       or (o.user_id is null and o.created_at > now() - interval '1 hour')
     )
   order by l.created_at, l.id;
$$;

revoke all on function public.get_merch_order_lines_by_session(text) from public;
grant execute on function public.get_merch_order_lines_by_session(text) to anon, authenticated;
