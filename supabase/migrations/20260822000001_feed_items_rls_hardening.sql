-- =============================================================================
-- feed_items RLS hardening (2026-08-22)
-- feed_items_update_own had no WITH CHECK, so a member could UPDATE their own
-- row's status/is_hidden directly via the client — self-approving a pending
-- photo or un-hiding a reported one, bypassing moderation entirely. The app
-- has no owner-edit UI (only delete), so there's no legitimate use for
-- members to UPDATE their own feed_items rows; drop the policy outright and
-- leave status/is_hidden writes to feed_items_admin_write only.
--
-- Separately, no feed_items_delete_own policy has ever existed — only
-- feed_items_admin_delete — even though the storefront lets an owner delete
-- their own post. Add the missing policy so that actually works.
-- =============================================================================

drop policy if exists "feed_items_update_own" on feed_items;

create policy "feed_items_delete_own" on feed_items
  for delete using ((select auth.uid()) = subscriber_id);
