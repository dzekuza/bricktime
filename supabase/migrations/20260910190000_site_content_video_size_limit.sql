-- =============================================================================
-- Raise site-content's upload size limit for hero/promo video (2026-09-10)
--
-- site-content had file_size_limit = null and allowed_mime_types = null, so it
-- fell back to the project's ~50MB default. The admin Content tab's hero and
-- floating promo video uploaders (HeroTab.tsx) need to accept 60MB .mov
-- exports from the marketing team's editing tool, which were being rejected
-- by Supabase Storage before reaching the app.
--
-- Limit raised to 100MB for headroom. Mime types pinned explicitly (matching
-- site-media) rather than left null, so the poster image upload in the same
-- tab keeps working under an explicit allow-list instead of an open one.
-- =============================================================================

update storage.buckets
   set file_size_limit = 104857600, -- 100MB
       allowed_mime_types = array[
         'video/mp4', 'video/quicktime', 'video/webm',
         'image/jpeg', 'image/png', 'image/webp', 'image/avif'
       ]
 where id = 'site-content';

-- Down migration (manual rollback):
-- update storage.buckets
--    set file_size_limit = null,
--        allowed_mime_types = null
--  where id = 'site-content';
