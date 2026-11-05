-- =============================================================================
-- Merch orders (2026-11-05)
-- Paid merch checkouts were never recorded: Stripe took the money, but the
-- webhook only knew about subscriptions, gift cards and penalties, so no row
-- was written, stock never moved and the admin had nothing to ship from.
-- `orders` can't hold these — it is rental-shaped (subscriber + LEGO product +
-- due date) — so merch gets its own table.
--
-- Rollback:
--   drop function if exists public.get_merch_order_by_session(text);
--   drop function if exists public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text);
--   drop table if exists public.merch_orders;
-- =============================================================================

create table public.merch_orders (
  id                 uuid          primary key default gen_random_uuid(),
  order_number       bigint        generated always as identity (start with 1001) unique,
  merch_item_id      uuid          references public.merch_items(id) on delete set null,
  -- Snapshot so the order still reads correctly if the item is renamed or deleted.
  item_name          text          not null,
  size               text          not null,
  amount             numeric(10,2) not null check (amount >= 0),
  buyer_email        text,
  buyer_name         text,
  buyer_phone        text,
  shipping_address   jsonb,
  user_id            uuid          references auth.users(id) on delete set null,
  stripe_session_id  text          not null unique,
  stripe_payment_intent_id text,
  status             text          not null default 'paid'
                       check (status in ('paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number    text,
  shipped_at         timestamptz,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now()
);

comment on table public.merch_orders is 'Paid merch purchases, written by stripe-webhook on checkout.session.completed.';

create trigger merch_orders_updated_at
  before update on public.merch_orders
  for each row execute procedure touch_updated_at();

alter table public.merch_orders enable row level security;

create policy "merch_orders_admin_read" on public.merch_orders
  for select using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "merch_orders_admin_update" on public.merch_orders
  for update using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "merch_orders_owner_read" on public.merch_orders
  for select using (user_id = (select auth.uid()));

-- Insert + stock decrement in one transaction, idempotent on the Stripe
-- session so a redelivered webhook neither duplicates the order nor takes a
-- second unit of stock. Returns true only for the first delivery, so the
-- caller sends the confirmation email exactly once.
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
  v_inserted  uuid;
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
  returning id into v_inserted;

  if v_inserted is null then
    return false;
  end if;

  update public.merch_items
     set stock = jsonb_set(
           stock,
           array[p_size],
           to_jsonb(greatest(coalesce((stock ->> p_size)::int, 0) - 1, 0))
         )
   where id = p_merch_item_id;

  return true;
end;
$$;

revoke all on function public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_merch_order(uuid, text, numeric, text, text, text, jsonb, uuid, text, text) to service_role;

-- The thank-you page may be opened by a guest buyer, so it can't rely on RLS.
-- The Stripe session id in its URL is unguessable and only reaches the buyer
-- through Stripe's redirect, so it serves as the lookup key.
create or replace function public.get_merch_order_by_session(p_session_id text)
returns table (
  order_number     bigint,
  item_name        text,
  size             text,
  amount           numeric,
  status           text,
  buyer_email      text,
  buyer_name       text,
  shipping_address jsonb,
  image_url        text,
  item_slug        text,
  created_at       timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.order_number, o.item_name, o.size, o.amount, o.status, o.buyer_email,
         o.buyer_name, o.shipping_address, i.image_url, i.slug, o.created_at
    from public.merch_orders o
    left join public.merch_items i on i.id = o.merch_item_id
   where o.stripe_session_id = p_session_id;
$$;

revoke all on function public.get_merch_order_by_session(text) from public;
grant execute on function public.get_merch_order_by_session(text) to anon, authenticated;
