-- Nothing ever stopped two members renting the same physical set: the checkout
-- only checked tier + Briksiai budget, and `product_status` was a hand-set
-- badge. Availability is stock minus the copies currently out -- a rental is
-- "out" until its order reaches 'returned' ('return_declined' means the set is
-- still with the member).

-- Every row was seeded before `stock` existed. Left at 0 the guard below would
-- make the whole catalogue unrentable, so assume one copy of each and let
-- admins correct the real quantities.
update public.products set stock = 1 where stock = 0;

-- NOT security_invoker: orders is restricted to `auth.uid() = subscriber_id`,
-- so an invoker-rights view would report every set as free for everyone. This
-- exposes per-product counts only -- never a subscriber, date or amount.
create or replace view public.product_availability as
select
  p.id as product_id,
  p.stock,
  count(o.id) filter (where o.status <> 'returned')::integer as rented,
  greatest(p.stock - count(o.id) filter (where o.status <> 'returned'), 0)::integer as available
from public.products p
left join public.orders o on o.product_id = p.id
group by p.id, p.stock;

grant select on public.product_availability to anon, authenticated;

create or replace function public.assert_product_available()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
  v_rented integer;
begin
  -- Locks the product row so two checkouts for the last copy serialise instead
  -- of both reading the same free count.
  select stock into v_stock
  from public.products
  where id = new.product_id
  for update;

  if v_stock is null then
    raise exception 'Product % does not exist', new.product_id
      using errcode = 'foreign_key_violation';
  end if;

  select count(*) into v_rented
  from public.orders
  where product_id = new.product_id and status <> 'returned';

  if v_rented >= v_stock then
    raise exception 'Product % is fully rented out', new.product_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_assert_product_available on public.orders;
create trigger orders_assert_product_available
  before insert on public.orders
  for each row execute function public.assert_product_available();

comment on view public.product_availability is 'Per-product rental availability: stock minus copies not yet returned.';
