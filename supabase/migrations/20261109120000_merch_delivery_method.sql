-- =============================================================================
-- Merch delivery method (2026-11-09)
-- Merch can now go to an LP EXPRESS parcel terminal (free) or to the door
-- (+EUR 3), like the subscription. The order keeps which one was chosen and,
-- for a terminal, which one, so shipping doesn't have to dig it out of Stripe.
--
-- The new record_merch_order parameters have defaults, so a webhook still on
-- the old 10-argument call keeps working until it is redeployed.
--
-- Rollback:
--   drop function if exists public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text, text, text, text);
--   alter table public.merch_orders drop column delivery_method, drop column lp_terminal_id, drop column lp_terminal_name;
--   then re-run the record_merch_order definition from 20261105210000_merch_order_stock_guard_fixes.sql.
-- =============================================================================

alter table public.merch_orders
  add column delivery_method  text not null default 'courier'
    check (delivery_method in ('courier', 'terminal')),
  add column lp_terminal_id   text,
  add column lp_terminal_name text;

drop function if exists public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text);

create or replace function public.record_merch_order(
  p_merch_item_id    uuid,
  p_size             text,
  p_amount           numeric,
  p_buyer_email      text,
  p_buyer_name       text,
  p_buyer_phone      text,
  p_shipping_address jsonb,
  p_user_id          uuid,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_delivery_method  text default 'courier',
  p_lp_terminal_id   text default null,
  p_lp_terminal_name text default null
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item_name  text;
  v_item_found boolean;
  v_order_id   uuid;
begin
  select name into v_item_name from public.merch_items where id = p_merch_item_id;
  v_item_found := found;

  insert into public.merch_orders (
    merch_item_id, item_name, size, amount, buyer_email, buyer_name, buyer_phone,
    shipping_address, user_id, stripe_session_id, stripe_payment_intent_id,
    delivery_method, lp_terminal_id, lp_terminal_name
  ) values (
    case when v_item_found then p_merch_item_id end,
    coalesce(v_item_name, 'Merch'), p_size, p_amount, p_buyer_email,
    p_buyer_name, p_buyer_phone, p_shipping_address, p_user_id, p_stripe_session_id,
    p_stripe_payment_intent_id,
    case when p_delivery_method = 'terminal' then 'terminal' else 'courier' end,
    p_lp_terminal_id, p_lp_terminal_name
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    return false;
  end if;

  -- Only a whole JSON number counts as stock; anything else reads as none, so
  -- a bad value can't make this function raise and block the order from saving.
  -- The decrement stays numeric: an int cast would raise above 2147483647.
  -- CASE guards the cast: Postgres doesn't promise AND evaluates left first.
  -- The row lock taken by UPDATE serialises concurrent webhooks.
  update public.merch_items
     set stock = jsonb_set(
           stock,
           array[p_size],
           to_jsonb((stock ->> p_size)::numeric - 1)
         )
   where id = p_merch_item_id
     and case
           when jsonb_typeof(stock -> p_size) = 'number'
             then (stock ->> p_size)::numeric >= 1
              and (stock ->> p_size)::numeric = floor((stock ->> p_size)::numeric)
           else false
         end;

  if not found then
    update public.merch_orders set stock_short = true where id = v_order_id;
  end if;

  return true;
end;
$$;

revoke all on function public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text, text, text, text) to service_role;
