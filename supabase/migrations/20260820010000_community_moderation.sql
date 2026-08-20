-- =============================================================================
-- Community moderation + auto-granted achievements (2026-08-20)
-- 1. feed_items.status — build_photo posts start 'pending', everything else
--    auto-approves; only admins can approve/reject.
-- 2. feed_items.is_hidden — admin can hide reported content without deleting it.
-- 3. reports table — members flag a feed item; admins triage.
-- 4. achievements.metric/threshold — structured criteria so unlocks can be
--    granted automatically instead of only by hand-seeded rows.
-- 5. evaluate_achievements() — recomputes a subscriber's metrics and inserts
--    any newly-earned unlocks; wired to fire after the activity that could
--    satisfy a metric (checkins/comments/photos via feed_items, likes via
--    feed_likes).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. feed_items.status — moderation state
-- ---------------------------------------------------------------------------

alter table feed_items
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected'));

create index if not exists idx_feed_items_status
  on feed_items(status, created_at desc) where status = 'pending';

-- New build_photo posts need review before they're public; every other event
-- type (checkin/comment/like/achievement/first_drop/streak) is system- or
-- text-only and auto-approves.
create or replace function set_feed_item_status()
returns trigger
language plpgsql
as $$
begin
  new.status := case when new.type = 'build_photo' then 'pending' else 'approved' end;
  return new;
end;
$$;

drop trigger if exists feed_items_set_status on feed_items;
create trigger feed_items_set_status
  before insert on feed_items
  for each row execute procedure set_feed_item_status();

-- 2. is_hidden — admin can hide content (e.g. after a report) without deleting it
alter table feed_items
  add column if not exists is_hidden boolean not null default false;

-- Visibility: approved + not hidden for everyone, plus the author and admins
-- always see their own / all rows (so authors see their own pending posts).
drop policy if exists "feed_items_select_auth" on feed_items;
create policy "feed_items_select_auth" on feed_items
  for select using (
    (select auth.role()) = 'authenticated'
    and (
      (status = 'approved' and not is_hidden)
      or subscriber_id = (select auth.uid())
      or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    )
  );

-- Pre-existing unscoped anon read policy (qual = true) predates this migration
-- and would bypass moderation entirely for logged-out visitors — rescope it
-- to the same approved/not-hidden rule instead of leaving it wide open.
drop policy if exists "feed_items_select_anon" on feed_items;
create policy "feed_items_select_anon" on feed_items
  for select using (status = 'approved' and not is_hidden);

drop policy if exists "feed_items_admin_write" on feed_items;
create policy "feed_items_admin_write" on feed_items
  for update using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

drop policy if exists "feed_items_admin_delete" on feed_items;
create policy "feed_items_admin_delete" on feed_items
  for delete using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

-- community_feed view needs to carry status/is_hidden through to the client
-- (own pending posts render with a "waiting for review" badge).
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
    fi.status,
    fi.is_hidden,
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
-- 3. Reports — member-submitted flags on a feed item, admin-triaged
-- ---------------------------------------------------------------------------

create table if not exists reports (
  id           uuid        primary key default gen_random_uuid(),
  feed_item_id uuid        not null references feed_items(id) on delete cascade,
  reporter_id  uuid        not null references subscribers(id) on delete cascade,
  reason       text,
  status       text        not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  unique (feed_item_id, reporter_id)
);

comment on table reports is 'Member-submitted reports on feed items (comments/photos) for moderation.';

create index if not exists idx_reports_status on reports(status, created_at desc);
create index if not exists idx_reports_feed_item on reports(feed_item_id);

alter table reports enable row level security;

create policy "reports_insert_own" on reports
  for insert with check ((select auth.uid()) = reporter_id);

create policy "reports_select_admin" on reports
  for select using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "reports_update_admin" on reports
  for update using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

-- ---------------------------------------------------------------------------
-- 4. achievements.metric/threshold — structured unlock criteria
-- ---------------------------------------------------------------------------

alter table achievements
  add column if not exists metric text
    check (metric in ('checkins', 'checkin_streak', 'comments_written', 'photos_shared', 'likes_received', 'membership_days')),
  add column if not exists threshold integer check (threshold > 0);

comment on column achievements.metric is 'Activity metric evaluate_achievements() checks; null = manual/unstructured award only.';
comment on column achievements.threshold is 'Value the metric must reach to auto-unlock this achievement.';

update achievements set metric = 'checkins',         threshold = 1   where id = 'daily_checkin';
update achievements set metric = 'comments_written', threshold = 10  where id = 'commenter';
update achievements set metric = 'photos_shared',    threshold = 1   where id = 'build_photo';
update achievements set metric = 'checkin_streak',   threshold = 7   where id = 'week_streak';
update achievements set metric = 'likes_received',   threshold = 20  where id = 'liker';
update achievements set metric = 'comments_written', threshold = 50  where id = 'collector_5';
update achievements set metric = 'photos_shared',    threshold = 5   where id = 'drop_streak_3';
update achievements set metric = 'likes_received',   threshold = 100 where id = 'old_member';
update achievements set metric = 'membership_days',  threshold = 365 where id = 'first_drop';

-- ---------------------------------------------------------------------------
-- 5. evaluate_achievements() — grant any achievement whose metric threshold
--    a subscriber now meets. security definer: authenticated users have no
--    insert policy on user_achievements, this is the only path unlocks happen.
-- ---------------------------------------------------------------------------

create or replace function evaluate_achievements(p_subscriber_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_joined_at timestamptz;
begin
  select joined_at into v_joined_at from public.subscribers where id = p_subscriber_id;
  if v_joined_at is null then
    return;
  end if;

  insert into public.user_achievements (subscriber_id, achievement_id)
  select p_subscriber_id, a.id
  from public.achievements a
  where a.metric is not null
    and not exists (
      select 1 from public.user_achievements ua
      where ua.subscriber_id = p_subscriber_id and ua.achievement_id = a.id
    )
    and (
      case a.metric
        when 'checkins' then (
          select count(*) from public.feed_items fi
          where fi.subscriber_id = p_subscriber_id and fi.type = 'checkin'
        )
        when 'checkin_streak' then (
          -- longest run of distinct calendar days with a checkin (gaps-and-islands)
          select coalesce(max(streak_len), 0) from (
            select count(*) as streak_len
            from (
              select day, day - (row_number() over (order by day))::int * interval '1 day' as grp
              from (
                select distinct date_trunc('day', created_at) as day
                from public.feed_items
                where subscriber_id = p_subscriber_id and type = 'checkin'
              ) d
            ) g
            group by grp
          ) s
        )
        when 'comments_written' then (
          select count(*) from public.feed_items fi
          where fi.subscriber_id = p_subscriber_id and fi.type = 'comment'
        )
        when 'photos_shared' then (
          select count(*) from public.feed_items fi
          where fi.subscriber_id = p_subscriber_id and fi.type = 'build_photo' and fi.status = 'approved'
        )
        when 'likes_received' then (
          select count(*) from public.feed_likes fl
          join public.feed_items fi on fi.id = fl.feed_item_id
          where fi.subscriber_id = p_subscriber_id
        )
        when 'membership_days' then (
          extract(day from now() - v_joined_at)::integer
        )
        else 0
      end
    ) >= a.threshold;
end;
$$;

grant execute on function evaluate_achievements(uuid) to authenticated;

create or replace function trigger_evaluate_achievements_feed_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform evaluate_achievements(new.subscriber_id);
  return new;
end;
$$;

drop trigger if exists feed_items_evaluate_achievements on feed_items;
create trigger feed_items_evaluate_achievements
  after insert or update of status on feed_items
  for each row execute procedure trigger_evaluate_achievements_feed_items();

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
    perform evaluate_achievements(v_owner);
  end if;
  return new;
end;
$$;

drop trigger if exists feed_likes_evaluate_achievements on feed_likes;
create trigger feed_likes_evaluate_achievements
  after insert on feed_likes
  for each row execute procedure trigger_evaluate_achievements_feed_likes();
