-- =============================================================================
-- Orders: record when a set came back (2026-11-05)
-- Members need a rental history with return dates, but marking an order
-- returned only bumped updated_at. returned_at is now set by a trigger on
-- every path that moves an order to 'returned' (admin UI, edge functions),
-- and cleared if the order leaves that status again.
-- Existing returned orders are backfilled from updated_at (best available).
--
-- Rollback: drop trigger orders_set_returned_at on public.orders;
--   drop function public.set_order_returned_at();
--   alter table public.orders drop column returned_at;
-- =============================================================================

alter table public.orders
  add column if not exists returned_at timestamptz;

create or replace function public.set_order_returned_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'returned' and (tg_op = 'INSERT' or old.status is distinct from 'returned') then
    new.returned_at := coalesce(new.returned_at, now());
  elsif new.status <> 'returned' then
    new.returned_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger orders_set_returned_at
  before insert or update of status on public.orders
  for each row execute function public.set_order_returned_at();

-- Backfill (run separately on 2026-11-05; safe to repeat).
update public.orders
   set returned_at = updated_at
 where status = 'returned' and returned_at is null;
