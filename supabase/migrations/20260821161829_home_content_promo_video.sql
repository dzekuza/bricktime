-- The floating promo video widget is currently hardcoded (src/lib/media.ts
-- PROMO_VIDEO_URL). Add an override column, same pattern as hero_video_url,
-- so it can be swapped from the admin dashboard; the site falls back to the
-- hardcoded default when this is null.

alter table public.home_content add column promo_video_url text;

-- Down migration (manual rollback):
-- alter table public.home_content drop column promo_video_url;
