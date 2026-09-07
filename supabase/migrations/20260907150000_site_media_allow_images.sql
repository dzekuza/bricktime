-- =============================================================================
-- Let site-media hold images as well as video (2026-09-07)
--
-- site-media was restricted to video/mp4, video/quicktime and video/webm, so
-- any image upload was rejected with 415 invalid_mime_type before RLS was even
-- consulted. That blocks the obvious companions to the videos it already
-- holds — most directly `home_content.hero_poster_url`, the poster frame shown
-- while hero-video.mp4 buffers.
--
-- The image types match what the other image buckets already accept
-- (products, feed): jpeg, png, webp, avif. The 50MB size limit is unchanged,
-- so this widens what may be uploaded, never how much.
-- =============================================================================

update storage.buckets
   set allowed_mime_types = array[
         'video/mp4', 'video/quicktime', 'video/webm',
         'image/jpeg', 'image/png', 'image/webp', 'image/avif'
       ]
 where id = 'site-media';

-- Down migration (manual rollback):
-- update storage.buckets
--    set allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm']
--  where id = 'site-media';
