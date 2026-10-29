-- =============================================================================
-- Stop members editing their own orders (2026-10-29)
--
-- orders_update lets the owner UPDATE any column of their own order, and the
-- authenticated role has column UPDATE grants on all of them. A member could set
-- their own order's status, product_id or amount (e.g. mark it 'returned' to free
-- Briksiai budget, or 'active' to satisfy the product review gate). The browser
-- never updates orders -- returns and tracking go through the lpexpress edge
-- functions with the service role -- so members get no writable columns.
--
-- Same shape as guard_member_order_insert(): a trigger, because admins share the
-- `authenticated` role with members. Service-role edge functions and
-- security-definer functions (current_user is not anon/authenticated) and admins
-- are not restricted.
-- =============================================================================

create or replace function public.guard_member_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated')
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  then
    return new;
  end if;

  if (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
    raise exception 'Members cannot modify orders'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_member_update on public.orders;
create trigger orders_guard_member_update
  before update on public.orders
  for each row execute function public.guard_member_order_update();

-- NOTE: rollback is `drop trigger orders_guard_member_update on public.orders;
-- drop function public.guard_member_order_update();`
