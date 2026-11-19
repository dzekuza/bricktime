-- =============================================================================
-- Claim several sets at once (2026-11-19)
-- The set cart places every rental in ONE transaction, so a cart that doesn't
-- fit (over budget, a set taken meanwhile, tier) is refused as a whole instead
-- of leaving half of it rented.
--
-- Invoker rights on purpose: each insert goes through the existing
-- guard_member_order_insert trigger and orders RLS exactly as a single
-- checkout insert does, so the budget, tier, pause, stock and delivery rules
-- stay defined in one place. Budget is checked per row inside the same
-- transaction, so rows see the ones inserted before them.
--
-- Only terminal delivery and plan-included door delivery are supported; the
-- paid courier fee is a per-order Stripe checkout (record_paid_courier_rental)
-- and the guard refuses door delivery the plan doesn't include.
--
-- Rollback: drop function public.claim_rentals(integer[], boolean, text, text);
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

  select array_agg(distinct x order by x) into v_ids
    from unnest(coalesce(p_product_ids, '{}')) as x;

  if v_ids is null or array_length(v_ids, 1) > 10 then
    raise exception 'Choose between 1 and 10 sets' using errcode = 'check_violation';
  end if;

  if not coalesce(p_home_delivery, false)
     and (nullif(trim(p_terminal_id), '') is null or nullif(trim(p_terminal_name), '') is null) then
    raise exception 'Choose a parcel terminal' using errcode = 'check_violation';
  end if;

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
