-- More admin WhatsApp alerts, raised by database triggers so every code path
-- (webhook, RPC, admin tool) is covered without touching each of them:
--   merch_order          a paid merch order is recorded
--   rental_order         a set is rented (one alert per cart)
--   mystery_request      a Mystery Box is requested
--   return_requested     a member asks to return a set
--   missing_part_request a member files the missing-parts form
--   gift_card_bought     a gift card is paid for (pending -> active)
--   product_review       a member posts a review
-- plus 'test', which the admin card inserts to check delivery end to end.
-- Orders created by an admin in the dashboard do not alert the admin.
-- A trigger problem never blocks the write it hangs on; it logs a warning.
--
-- Rollback: drop trigger merch_orders_notify_admin on public.merch_orders;
--           drop trigger orders_notify_admin_insert on public.orders;
--           drop trigger orders_notify_admin_return on public.orders;
--           drop trigger missing_part_requests_notify_admin on public.missing_part_requests;
--           drop trigger gift_cards_notify_admin on public.gift_cards;
--           drop trigger product_reviews_notify_admin on public.product_reviews;
--           drop function public.notify_admin_merch_order(),
--             public.notify_admin_order_insert(), public.notify_admin_order_return(),
--             public.notify_admin_missing_part(), public.notify_admin_gift_card(),
--             public.notify_admin_review(), public.is_admin_session(),
--             public.enqueue_admin_notification(text, jsonb, text);
--           drop policy admin_notifications_admin_test_insert on public.admin_notifications;
--           revoke insert on public.admin_notifications from authenticated;

create or replace function public.enqueue_admin_notification(
  p_kind text,
  p_payload jsonb,
  p_dedupe_key text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_notifications (kind, payload, dedupe_key)
  values (p_kind, p_payload, p_dedupe_key)
  on conflict (dedupe_key) do nothing;
$$;

revoke all on function public.enqueue_admin_notification(text, jsonb, text)
  from public, anon, authenticated;

create or replace function public.is_admin_session()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Merch orders are recorded only once paid, so an insert is a paid order.
create or replace function public.notify_admin_merch_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.enqueue_admin_notification(
    'merch_order',
    jsonb_build_object(
      'order_number', new.order_number,
      'name', new.buyer_name,
      'item', new.item_name,
      'amount', new.amount
    ),
    'merch_order:' || new.id
  );
  return new;
exception when others then
  raise warning 'notify_admin_merch_order failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger merch_orders_notify_admin
  after insert on public.merch_orders
  for each row execute function public.notify_admin_merch_order();

-- A rental with a set, or a Mystery Box request (no set yet).
create or replace function public.notify_admin_order_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_title text;
begin
  if public.is_admin_session() then
    return new;
  end if;

  select name into v_name from public.subscribers where id = new.subscriber_id;

  if new.product_id is null then
    if new.status = 'requested' then
      perform public.enqueue_admin_notification(
        'mystery_request',
        jsonb_build_object('name', v_name),
        'mystery_request:' || new.id
      );
    end if;
    return new;
  end if;

  select title into v_title from public.products where id = new.product_id;

  -- One alert per cart: the first row of a cart wins, the rest are no-ops.
  perform public.enqueue_admin_notification(
    'rental_order',
    jsonb_build_object('name', v_name, 'product', v_title),
    'rental_order:' || coalesce(new.cart_id::text, new.id::text)
  );
  return new;
exception when others then
  raise warning 'notify_admin_order_insert failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger orders_notify_admin_insert
  after insert on public.orders
  for each row execute function public.notify_admin_order_insert();

create or replace function public.notify_admin_order_return()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_title text;
begin
  -- Only a member's own request is news; an admin moving an order to this
  -- status in the dashboard is not.
  if public.is_admin_session() then
    return new;
  end if;

  select name into v_name from public.subscribers where id = new.subscriber_id;
  select title into v_title from public.products where id = new.product_id;
  perform public.enqueue_admin_notification(
    'return_requested',
    jsonb_build_object('name', v_name, 'product', v_title),
    'return_requested:' || new.id
  );
  return new;
exception when others then
  raise warning 'notify_admin_order_return failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger orders_notify_admin_return
  after update of status on public.orders
  for each row
  when (new.status = 'return_requested' and old.status is distinct from new.status)
  execute function public.notify_admin_order_return();

create or replace function public.notify_admin_missing_part()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  select name into v_name from public.subscribers where id = new.subscriber_id;
  perform public.enqueue_admin_notification(
    'missing_part_request',
    jsonb_build_object(
      'name', v_name,
      'set', new.lego_set_code,
      'part', new.part_code,
      'quantity', new.quantity
    ),
    'missing_part_request:' || new.id
  );
  return new;
exception when others then
  raise warning 'notify_admin_missing_part failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger missing_part_requests_notify_admin
  after insert on public.missing_part_requests
  for each row execute function public.notify_admin_missing_part();

-- Only a card that was bought (pending, then paid) alerts; cards an admin
-- creates are inserted already active.
create or replace function public.notify_admin_gift_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.enqueue_admin_notification(
    'gift_card_bought',
    jsonb_build_object('amount', new.amount_cents / 100.0, 'email', new.buyer_email),
    'gift_card_bought:' || new.id
  );
  return new;
exception when others then
  raise warning 'notify_admin_gift_card failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger gift_cards_notify_admin
  after update of status on public.gift_cards
  for each row
  when (old.status = 'pending' and new.status = 'active')
  execute function public.notify_admin_gift_card();

create or replace function public.notify_admin_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_title text;
begin
  select name into v_name from public.subscribers where id = new.subscriber_id;
  select title into v_title from public.products where id = new.product_id;
  perform public.enqueue_admin_notification(
    'product_review',
    jsonb_build_object('name', v_name, 'product', v_title, 'rating', new.rating),
    'product_review:' || new.id
  );
  return new;
exception when others then
  raise warning 'notify_admin_review failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger product_reviews_notify_admin
  after insert on public.product_reviews
  for each row execute function public.notify_admin_review();

revoke all on function
  public.notify_admin_merch_order(), public.notify_admin_order_insert(),
  public.notify_admin_order_return(), public.notify_admin_missing_part(),
  public.notify_admin_gift_card(), public.notify_admin_review()
  from public, anon, authenticated;

-- The admin card inserts a 'test' row to check delivery end to end. Admins
-- may insert only that kind, and only the two columns they need: status,
-- attempts, sent_at and payload keep their defaults, so a row cannot be
-- created already "sent" or with a crafted payload. Everything else is
-- written by the system.
grant insert (kind, dedupe_key) on public.admin_notifications to authenticated;

create policy admin_notifications_admin_test_insert on public.admin_notifications
  for insert to authenticated
  with check (
    kind = 'test'
    and (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  );
