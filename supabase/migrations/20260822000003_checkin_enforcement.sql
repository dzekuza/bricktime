-- =============================================================================
-- Check-in enforcement (2026-08-22)
-- There was no way for a member to actually perform a "checkin" feed_items
-- row — the daily_checkin achievement and the checkins/checkin_streak
-- challenge metrics existed but nothing ever wrote one. The storefront now
-- inserts a plain feed_items row (type='checkin'), same as it already does
-- for comments/photos — this trigger is what makes "once per day" a real
-- server-side rule instead of a client-only check that a direct API call
-- could bypass.
-- =============================================================================

create or replace function enforce_checkin_once_per_day()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'checkin' and exists (
    select 1 from feed_items
    where subscriber_id = new.subscriber_id
      and type = 'checkin'
      and created_at >= date_trunc('day', now())
  ) then
    raise exception 'already checked in today';
  end if;
  return new;
end;
$$;

drop trigger if exists feed_items_enforce_checkin on feed_items;
create trigger feed_items_enforce_checkin
  before insert on feed_items
  for each row execute procedure enforce_checkin_once_per_day();
