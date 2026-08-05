-- Hero video is currently hardcoded (src/lib/media.ts HERO_VIDEO_URL) and reused
-- identically on both the Home hero and the Subscribe page hero. Add an override
-- column so it can be swapped from the admin dashboard; both pages fall back to
-- the hardcoded default when this is null.

alter table public.home_content add column hero_video_url text;

-- Down migration (manual rollback):
-- alter table public.home_content drop column hero_video_url;
