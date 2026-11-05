-- =============================================================================
-- Merch checkout hardening (2026-11-05)
-- 1. Gift card holds now record who placed them (`reserved_by`). Only that
--    account can take the card over again, so typing someone else's code no
--    longer locks the owner out.
-- 2. Coupon uses are reserved when a checkout opens (`coupon_holds`), counted
--    against max_uses together with redeemed uses. Several open checkouts can
--    no longer all pass the check for the last remaining use. Like gift card
--    holds, a hold lapses on its own when a checkout is abandoned.
-- 3. get_merch_order_by_session returns buyer name, email and address only to
--    the order's own account, or to anyone holding the session id of a guest
--    order during the first hour after purchase. A session id that later leaks
--    from browser history or a shared link exposes no personal data.
--
-- Rollback: remove claim_coupon_hold(text, integer), the coupon_holds table and
-- gift_cards.reserved_by, then restore get_merch_order_by_session from
-- 20261105172719_merch_orders.sql.
-- =============================================================================

alter table public.gift_cards
  add column if not exists reserved_by uuid references auth.users(id) on delete set null;

comment on column public.gift_cards.reserved_by is
  'Account whose open Checkout Session holds this card; only it may re-hold the card before reserved_until passes.';

create table if not exists public.coupon_holds (
  id          uuid        primary key default gen_random_uuid(),
  coupon_code text        not null,
  held_until  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Service role only: no policies, so anon and authenticated see nothing.
alter table public.coupon_holds enable row level security;

-- Locks the coupon row so two checkouts can't both take the last use.
create or replace function public.claim_coupon_hold(p_code text, p_minutes integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coupon public.coupons%rowtype;
  v_held   integer;
  v_id     uuid;
begin
  select * into v_coupon
    from public.coupons
   where code = upper(p_code)
     for update;

  if not found
     or not v_coupon.active
     or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) then
    return null;
  end if;

  delete from public.coupon_holds
   where coupon_code = v_coupon.code and held_until <= now();

  if v_coupon.max_uses is not null then
    select count(*) into v_held
      from public.coupon_holds
     where coupon_code = v_coupon.code;
    if v_coupon.uses_count + v_held >= v_coupon.max_uses then
      return null;
    end if;
  end if;

  insert into public.coupon_holds (coupon_code, held_until)
  values (v_coupon.code, now() + make_interval(mins => p_minutes))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.claim_coupon_hold(text, integer) from public, anon, authenticated;
grant execute on function public.claim_coupon_hold(text, integer) to service_role;

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
  with o as (
    select mo.*,
           (mo.user_id is not null and mo.user_id = (select auth.uid()))
           or (mo.user_id is null and mo.created_at > now() - interval '1 hour')
             as can_see_buyer
      from public.merch_orders mo
     where mo.stripe_session_id = p_session_id
  )
  select o.order_number, o.item_name, o.size, o.amount, o.status,
         case when o.can_see_buyer then o.buyer_email end,
         case when o.can_see_buyer then o.buyer_name end,
         case when o.can_see_buyer then o.shipping_address end,
         i.image_url, i.slug, o.created_at
    from o
    left join public.merch_items i on i.id = o.merch_item_id;
$$;

revoke all on function public.get_merch_order_by_session(text) from public;
grant execute on function public.get_merch_order_by_session(text) to anon, authenticated;
