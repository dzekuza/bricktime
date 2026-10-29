-- =============================================================================
-- community_feed: enforce moderation inside the view (2026-10-29)
--
-- 20260907120000_restrict_subscriber_pii switched community_feed to
-- security_invoker = false so it can read `subscribers` without a blanket
-- SELECT policy. That also made the view bypass the feed_items RLS policies, so
-- pending/rejected/hidden posts became visible to everyone, logged out
-- included. The view is now the boundary, so it has to apply the same rule as
-- feed_items_select_auth: approved and not hidden, plus the author's own rows
-- and everything for admins.
-- =============================================================================

create or replace view public.community_feed as
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
  s.name as user_name,
  s.avatar_id,
  s.avatar_bg,
  s.plan,
  (exists (
    select 1 from public.feed_likes fl
    where fl.feed_item_id = fi.id
      and fl.subscriber_id = (select auth.uid())
  )) as "likedByCurrentUser",
  s.avatar_url
from public.feed_items fi
join public.subscribers s on s.id = fi.subscriber_id
where
  (fi.status = 'approved' and not fi.is_hidden)
  or fi.subscriber_id = (select auth.uid())
  or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

-- NOTE: rollback is re-running the community_feed definition from
-- 20260925121000_views_expose_avatar_url.sql (same view, without the where clause).
