-- =============================================================================
-- Daily check-in points (2026-09-21)
-- "Svečias" (daily_checkin) was a one-time achievement: user_achievements has a
-- (subscriber_id, achievement_id) primary key, so its +10 points were awarded
-- once and never again. The intent is +10 for every distinct day a member
-- visits. feed_items already holds one 'checkin' row per member per day
-- (enforce_checkin_once_per_day), so the points are derived from those rows:
--   total = one-time achievement points (excluding daily_checkin)
--         + distinct check-in days * daily_checkin.points
-- A "day" is a Lithuanian calendar day (Europe/Vilnius), not UTC, so the reset
-- happens at local midnight: the once-per-day trigger, both views and the
-- checkin_streak metric all use it.
-- Both public views are owner-rights (see 20260827000007 / 20260907120000);
-- column names and types are unchanged.
-- =============================================================================

update achievements
set description = 'Apsilankyk Brick Time – +10 taškų kiekvieną dieną'
where id = 'daily_checkin';

create or replace view leaderboard as
  select
    s.id                as subscriber_id,
    s.name,
    s.avatar_id,
    s.avatar_bg,
    s.plan              as tier,
    ach.achievement_count,
    ach.total_points + chk.days * chk.day_points as total_points,
    ord.drops_received,
    row_number() over (
      order by ach.total_points + chk.days * chk.day_points desc, s.joined_at asc
    ) as rank
  from subscribers s
    cross join lateral (
      select
        count(*)::bigint                   as achievement_count,
        coalesce(sum(a.points) filter (where a.id <> 'daily_checkin'), 0)::bigint as total_points
      from user_achievements ua
        join achievements a on a.id = ua.achievement_id
      where ua.subscriber_id = s.id
    ) ach
    cross join lateral (
      select
        (select count(distinct (fi.created_at at time zone 'Europe/Vilnius')::date)
           from feed_items fi
          where fi.subscriber_id = s.id and fi.type = 'checkin')::bigint as days,
        coalesce((select points from achievements where id = 'daily_checkin'), 0)::bigint as day_points
    ) chk
    cross join lateral (
      select count(*)::bigint as drops_received
      from orders o
      where o.subscriber_id = s.id
        and o.status = any (array['active'::order_status, 'returned'::order_status])
    ) ord
  where s.status = 'active'::subscriber_status;

create or replace view public.user_profile_view as
  select
    s.id,
    s.name,
    s.plan,
    s.status,
    s.avatar_id,
    s.avatar_bg,
    s.joined_at,
    (
      coalesce((
        select sum(a.points)
        from user_achievements ua
        join achievements a on a.id = ua.achievement_id
        where ua.subscriber_id = s.id and a.id <> 'daily_checkin'
      ), 0)
      + (
        select count(distinct (fi.created_at at time zone 'Europe/Vilnius')::date)
        from feed_items fi
        where fi.subscriber_id = s.id and fi.type = 'checkin'
      ) * coalesce((select points from achievements where id = 'daily_checkin'), 0)
    )::integer as total_points,
    (
      select count(*)::integer
      from user_achievements ua
      where ua.subscriber_id = s.id
    ) as achievement_count,
    (
      select count(*)::integer
      from orders o
      where o.subscriber_id = s.id
        and o.status = any (array['active'::order_status, 'returned'::order_status])
    ) as drops_received
  from subscribers s;

create or replace function enforce_checkin_once_per_day()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'checkin' and exists (
    select 1 from feed_items
    where subscriber_id = new.subscriber_id
      and type = 'checkin'
      and created_at >= date_trunc('day', now() at time zone 'Europe/Vilnius') at time zone 'Europe/Vilnius'
  ) then
    raise exception 'already checked in today';
  end if;
  return new;
end;
$$;

-- Streak days are Lithuanian calendar days too (date minus int stays a date).
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
              select day, day - (row_number() over (order by day))::int as grp
              from (
                select distinct (created_at at time zone 'Europe/Vilnius')::date as day
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
