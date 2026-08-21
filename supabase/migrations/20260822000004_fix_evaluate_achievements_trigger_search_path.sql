-- =============================================================================
-- Fix: evaluate_achievements() calls in the feed_items/feed_likes triggers
-- were unqualified while the trigger functions set search_path = '', so
-- Postgres couldn't resolve the function — every insert into feed_items
-- (comments, photo uploads, checkins) and feed_likes has been failing with
-- "function evaluate_achievements(uuid) does not exist" since
-- 20260820010000_community_moderation.sql shipped. Qualify with public.
-- =============================================================================

create or replace function trigger_evaluate_achievements_feed_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.evaluate_achievements(new.subscriber_id);
  return new;
end;
$$;

create or replace function trigger_evaluate_achievements_feed_likes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select subscriber_id into v_owner from public.feed_items where id = new.feed_item_id;
  if v_owner is not null then
    perform public.evaluate_achievements(v_owner);
  end if;
  return new;
end;
$$;
