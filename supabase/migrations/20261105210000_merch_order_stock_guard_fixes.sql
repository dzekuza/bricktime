-- =============================================================================
-- Merch order stock guard — follow-up (2026-11-05)
-- Two gaps left by 20261105200000_merch_order_stock_guard.sql:
--   1. An order for an item deleted after checkout inserted the stale id into
--      merch_item_id, a foreign key, so the insert failed and the webhook failed
--      on every Stripe retry — the paid order was never saved. The id is now
--      stored only while the item still exists; the order keeps its name
--      snapshot and is flagged stock_short for manual handling.
--   2. Fractional stock such as 1.5 floored to 1 and was taken as a unit. Stock
--      now counts only when it is a whole number; anything else is no stock,
--      matching create-merch-checkout.
-- Correction to the earlier header: a stored "5" (a JSON string) did not make
-- `::int` raise — `->>` returns 5, which casts. Non-numeric text and
-- fractions did.
--
-- Rollback: re-run the record_merch_order definition from
-- 20261105200000_merch_order_stock_guard.sql.
-- =============================================================================

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
  p_stripe_payment_intent_id text
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
    shipping_address, user_id, stripe_session_id, stripe_payment_intent_id
  ) values (
    case when v_item_found then p_merch_item_id end,
    coalesce(v_item_name, 'Merch'), p_size, p_amount, p_buyer_email,
    p_buyer_name, p_buyer_phone, p_shipping_address, p_user_id, p_stripe_session_id,
    p_stripe_payment_intent_id
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    return false;
  end if;

  -- Only a whole JSON number counts as stock; anything else reads as none, so
  -- a bad value can't make this function raise and block the order from saving.
  -- CASE guards the cast: Postgres doesn't promise AND evaluates left first.
  -- The row lock taken by UPDATE serialises concurrent webhooks.
  update public.merch_items
     set stock = jsonb_set(
           stock,
           array[p_size],
           to_jsonb((stock ->> p_size)::numeric::int - 1)
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

revoke all on function public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text) to service_role;
