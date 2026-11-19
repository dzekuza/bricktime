-- =============================================================================
-- Paid courier for a whole set cart (2026-11-19)
-- One EUR 3 courier fee covers every set in the cart (one parcel). The fee is
-- paid in Stripe Checkout and stripe-webhook then creates all the rentals
-- through record_paid_courier_rentals, all-or-nothing in one transaction.
--
-- orders.stripe_session_id is unique, so only the FIRST order of a cart carries
-- the session id (and the fee as its amount); the others are plain EUR 0
-- rentals. That first order doubles as the idempotency marker: a retried
-- webhook finds it and creates nothing, and usePaidCourierReturn finds it too.
--
-- Same rules as a single paid courier rental (apply_member_rental_rules with
-- the fee paid). Each product is checked after the previous one is inserted,
-- so the budget check sees the sets already added in this transaction.
--
-- Rollback: drop function public.record_paid_courier_rentals(uuid, integer[], text, numeric, boolean);
-- =============================================================================

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
  select array_agg(distinct x order by x) into v_ids
    from unnest(coalesce(p_product_ids, '{}')) as x;

  if v_ids is null or array_length(v_ids, 1) > 10 then
    raise exception 'Choose between 1 and 10 sets' using errcode = 'check_violation';
  end if;

  if not p_dry_run then
    if exists (
      select 1 from public.orders where stripe_session_id = p_stripe_session_id
    ) then
      return 0;
    end if;
  end if;

  if p_dry_run then
    -- Nothing is written, so the cart is checked as a whole: every set must be
    -- free, and together they must fit the budget that is left.
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
