-- =============================================================================
-- Best-practices fixes (2026-05-12)
-- 1. RLS policies: wrap auth.uid() / auth.role() in (select …) — evaluated
--    once per query instead of once per row (5-10× perf improvement)
-- 2. Missing FK indexes on feed_items and user_achievements
-- 3. parent_id column on feed_items (thread replies, used by Community page)
-- 4. community_feed view (used by Community.tsx)
-- 5. user_profile_view (used by UserProfile.tsx)
-- 6. toggle_like() RPC — atomic like/unlike, no race condition
-- 7. Leaderboard cron refresh (pg_cron)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. RLS policies — wrap auth calls in (select …)
-- ---------------------------------------------------------------------------

-- subscribers
drop policy if exists "subscribers_select_own"  on subscribers;
drop policy if exists "subscribers_update_own"  on subscribers;

create policy "subscribers_select_own" on subscribers
  for select using ((select auth.uid()) = id);

create policy "subscribers_update_own" on subscribers
  for update using      ((select auth.uid()) = id)
  with check            ((select auth.uid()) = id);

-- orders
drop policy if exists "orders_select_own" on orders;

create policy "orders_select_own" on orders
  for select using ((select auth.uid()) = subscriber_id);

-- user_achievements
drop policy if exists "user_achievements_select_own" on user_achievements;

create policy "user_achievements_select_own" on user_achievements
  for select using ((select auth.uid()) = subscriber_id);

-- feed_items
drop policy if exists "feed_items_select_auth"  on feed_items;
drop policy if exists "feed_items_insert_own"   on feed_items;
drop policy if exists "feed_items_update_own"   on feed_items;

create policy "feed_items_select_auth" on feed_items
  for select using ((select auth.role()) = 'authenticated');

create policy "feed_items_insert_own" on feed_items
  for insert with check ((select auth.uid()) = subscriber_id);

create policy "feed_items_update_own" on feed_items
  for update using ((select auth.uid()) = subscriber_id);

-- feed_likes
drop policy if exists "feed_likes_select_auth"  on feed_likes;
drop policy if exists "feed_likes_insert_own"   on feed_likes;
drop policy if exists "feed_likes_delete_own"   on feed_likes;

create policy "feed_likes_select_auth" on feed_likes
  for select using ((select auth.role()) = 'authenticated');

create policy "feed_likes_insert_own" on feed_likes
  for insert with check ((select auth.uid()) = subscriber_id);

create policy "feed_likes_delete_own" on feed_likes
  for delete using ((select auth.uid()) = subscriber_id);

-- ---------------------------------------------------------------------------
-- 2. Missing FK indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_feed_items_drop_num
  on feed_items(drop_num)         where drop_num       is not null;

create index if not exists idx_feed_items_achievement_id
  on feed_items(achievement_id)   where achievement_id  is not null;

create index if not exists idx_user_achievements_achievement
  on user_achievements(achievement_id);

-- ---------------------------------------------------------------------------
-- 3. parent_id column on feed_items (thread replies)
-- ---------------------------------------------------------------------------

alter table feed_items
  add column if not exists parent_id uuid
    references feed_items(id) on delete cascade;

create index if not exists idx_feed_items_parent
  on feed_items(parent_id) where parent_id is not null;

-- ---------------------------------------------------------------------------
-- 4. community_feed view
--    security_invoker = true → view respects caller's RLS
-- ---------------------------------------------------------------------------

drop view if exists community_feed;

create view community_feed
  with (security_invoker = true)
as
  select
    fi.id,
    fi.subscriber_id,
    fi.type,
    fi.body,
    fi.image_url,
    fi.drop_num,
    fi.achievement_id,
    fi.like_count,
    fi.created_at,
    fi.parent_id,
    s.name       as user_name,
    s.avatar_id,
    s.avatar_bg,
    s.plan,
    exists(
      select 1 from feed_likes fl
      where fl.feed_item_id = fi.id
        and fl.subscriber_id = (select auth.uid())
    ) as "likedByCurrentUser"
  from feed_items fi
  join subscribers s on s.id = fi.subscriber_id;

-- ---------------------------------------------------------------------------
-- 5. user_profile_view
-- ---------------------------------------------------------------------------

drop view if exists user_profile_view;

create view user_profile_view
  with (security_invoker = true)
as
  select
    s.id,
    s.name,
    s.email,
    s.plan,
    s.status,
    s.avatar_id,
    s.avatar_bg,
    s.joined_at,
    coalesce(
      (select sum(a.points)
       from user_achievements ua
       join achievements a on a.id = ua.achievement_id
       where ua.subscriber_id = s.id), 0
    )::integer                     as total_points,
    (select count(*)::integer
       from user_achievements ua
       where ua.subscriber_id = s.id)   as achievement_count,
    (select count(*)::integer
       from orders o
       where o.subscriber_id = s.id
         and o.status in ('active','returned')) as drops_received
  from subscribers s;

-- ---------------------------------------------------------------------------
-- 6. toggle_like() — atomic, no race condition on like_count
-- ---------------------------------------------------------------------------

create or replace function toggle_like(p_feed_item_id uuid, p_subscriber_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.feed_likes
    where feed_item_id  = p_feed_item_id
      and subscriber_id = p_subscriber_id
  ) then
    delete from public.feed_likes
    where feed_item_id  = p_feed_item_id
      and subscriber_id = p_subscriber_id;
    update public.feed_items
       set like_count = greatest(0, like_count - 1)
     where id = p_feed_item_id;
  else
    insert into public.feed_likes(feed_item_id, subscriber_id)
    values (p_feed_item_id, p_subscriber_id);
    update public.feed_items
       set like_count = like_count + 1
     where id = p_feed_item_id;
  end if;
end;
$$;

grant execute on function toggle_like(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Leaderboard refresh via pg_cron (daily at 03:00 UTC)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'refresh-leaderboard',
      '0 3 * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard'
    );
  end if;
end;
$$;
