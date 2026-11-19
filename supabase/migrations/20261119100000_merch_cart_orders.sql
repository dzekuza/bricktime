-- =============================================================================
-- Merch cart orders (2026-11-19)
-- A merch checkout can now hold several items. The order stays ONE merch_orders
-- row per Stripe session (item_name / size become a summary such as
-- "Brick Tee +1", so the admin app keeps rendering it) and the real lines live
-- in merch_order_items.
--
-- record_merch_order stays for sessions opened before the cart shipped.
--
-- Rollback:
--   drop function if exists public.get_merch_order_lines_by_session(text);
--   drop function if exists public.record_merch_cart_order(jsonb, numeric, text, text, text, jsonb, uuid, text, text, text, text, text);
--   drop table if exists public.merch_order_items;
-- =============================================================================

create table public.merch_order_items (
  id            uuid          primary key default gen_random_uuid(),
  order_id      uuid          not null references public.merch_orders(id) on delete cascade,
  -- Nullable so deleting an item keeps the order readable via the snapshot.
  merch_item_id uuid          references public.merch_items(id) on delete set null,
  item_name     text          not null,
  size          text          not null,
  quantity      int           not null check (quantity >= 1),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  created_at    timestamptz   not null default now()
);

comment on table public.merch_order_items is 'Lines of a merch order, written by record_merch_cart_order.';

alter table public.merch_order_items enable row level security;

create policy "merch_order_items_admin_read" on public.merch_order_items
  for select using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "merch_order_items_owner_read" on public.merch_order_items
  for select using (
    exists (
      select 1 from public.merch_orders o
       where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

-- Order, lines and stock in one transaction, idempotent on the Stripe session
-- like record_merch_order. p_lines is [{"item_id": uuid, "size": text,
-- "quantity": int}]. Returns true only for the first delivery.
create or replace function public.record_merch_cart_order(
  p_lines            jsonb,
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
  v_line       jsonb;
  v_item_id    uuid;
  v_size       text;
  v_qty        int;
  v_name       text;
  v_price      numeric;
  v_found      boolean;
  v_order_id   uuid;
  v_first_name text;
  v_sizes      text[] := '{}';
  v_count      int := 0;
  v_short      boolean := false;
begin
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'p_lines must be a non-empty array';
  end if;

  -- Resolve names first so the order row can carry the summary.
  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_item_id := (v_line ->> 'item_id')::uuid;
    select name into v_name from public.merch_items where id = v_item_id;
    v_count := v_count + 1;
    if v_count = 1 then
      v_first_name := coalesce(v_name, 'Merch');
    end if;
    v_sizes := v_sizes || (v_line ->> 'size');
  end loop;

  insert into public.merch_orders (
    merch_item_id, item_name, size, amount, buyer_email, buyer_name, buyer_phone,
    shipping_address, user_id, stripe_session_id, stripe_payment_intent_id,
    delivery_method, lp_terminal_id, lp_terminal_name
  ) values (
    case when v_count = 1 then (
      select id from public.merch_items where id = ((p_lines -> 0) ->> 'item_id')::uuid
    ) end,
    case when v_count = 1 then v_first_name else v_first_name || ' +' || (v_count - 1) end,
    array_to_string(v_sizes, ', '),
    p_amount, p_buyer_email, p_buyer_name, p_buyer_phone, p_shipping_address,
    p_user_id, p_stripe_session_id, p_stripe_payment_intent_id,
    case when p_delivery_method = 'terminal' then 'terminal' else 'courier' end,
    p_lp_terminal_id, p_lp_terminal_name
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    return false;
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_item_id := (v_line ->> 'item_id')::uuid;
    v_size    := v_line ->> 'size';
    v_qty     := (v_line ->> 'quantity')::int;

    select name, price into v_name, v_price from public.merch_items where id = v_item_id;
    v_found := found;

    insert into public.merch_order_items (
      order_id, merch_item_id, item_name, size, quantity, unit_price
    ) values (
      v_order_id, case when v_found then v_item_id end,
      coalesce(v_name, 'Merch'), v_size, v_qty, coalesce(v_price, 0)
    );

    -- Same whole-number stock rule as record_merch_order, now for a quantity.
    -- A short line keeps its stock untouched and flags the order for review.
    update public.merch_items
       set stock = jsonb_set(
             stock,
             array[v_size],
             to_jsonb((stock ->> v_size)::numeric - v_qty)
           )
     where id = v_item_id
       and case
             when jsonb_typeof(stock -> v_size) = 'number'
               then (stock ->> v_size)::numeric >= v_qty
                and (stock ->> v_size)::numeric = floor((stock ->> v_size)::numeric)
             else false
           end;

    if not found then
      v_short := true;
    end if;
  end loop;

  if v_short then
    update public.merch_orders set stock_short = true where id = v_order_id;
  end if;

  return true;
end;
$$;

revoke all on function public.record_merch_cart_order(jsonb, numeric, text, text, text, jsonb, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_merch_cart_order(jsonb, numeric, text, text, text, jsonb, uuid, text, text, text, text, text) to service_role;

-- Guest buyers reach the thank-you page too, so this uses the unguessable
-- Stripe session id as the key, like get_merch_order_by_session.
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
   order by l.created_at, l.id;
$$;

revoke all on function public.get_merch_order_lines_by_session(text) from public;
grant execute on function public.get_merch_order_lines_by_session(text) to anon, authenticated;
