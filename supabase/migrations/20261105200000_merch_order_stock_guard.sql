-- =============================================================================
-- Merch order stock guard (2026-11-05)
-- record_merch_order clamped stock at zero but never checked a unit was left,
-- so two paid checkouts for the last unit both recorded silently. It also
-- cast stock with `::int`, which errors on a stored value like 0.5 or "5"
-- — the webhook then failed on every Stripe retry and the paid order was
-- never saved.
--
-- The order is always recorded (the money is already taken). Taking a unit is
-- now a conditional UPDATE that only succeeds while stock remains; when it
-- doesn't, the order is flagged `stock_short` so the admin can restock,
-- substitute or refund instead of shipping from stock that isn't there.
--
-- Rollback:
--   alter table public.merch_orders drop column if exists stock_short;
--   then re-run the record_merch_order definition from
--   20261105172719_merch_orders.sql.
-- =============================================================================

alter table public.merch_orders
  add column if not exists stock_short boolean not null default false;

comment on column public.merch_orders.stock_short is
  'True when the order was paid but no unit of its size was left to take — needs manual handling.';

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
  v_item_name text;
  v_order_id  uuid;
begin
  select name into v_item_name from public.merch_items where id = p_merch_item_id;

  insert into public.merch_orders (
    merch_item_id, item_name, size, amount, buyer_email, buyer_name, buyer_phone,
    shipping_address, user_id, stripe_session_id, stripe_payment_intent_id
  ) values (
    p_merch_item_id, coalesce(v_item_name, 'Merch'), p_size, p_amount, p_buyer_email,
    p_buyer_name, p_buyer_phone, p_shipping_address, p_user_id, p_stripe_session_id,
    p_stripe_payment_intent_id
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    return false;
  end if;

  -- Only a JSON number counts as stock; anything else reads as none, so a bad
  -- value can't make this function raise and block the order from saving.
  -- CASE guards the cast: Postgres doesn't promise AND evaluates left first.
  -- The row lock taken by UPDATE serialises concurrent webhooks.
  update public.merch_items
     set stock = jsonb_set(
           stock,
           array[p_size],
           to_jsonb(floor((stock ->> p_size)::numeric)::int - 1)
         )
   where id = p_merch_item_id
     and case
           when jsonb_typeof(stock -> p_size) = 'number'
             then floor((stock ->> p_size)::numeric) >= 1
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
