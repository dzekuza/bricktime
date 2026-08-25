-- =============================================================================
-- Challenge reward image (2026-08-26)
-- Challenges only supported a text reward_label; admin has no way to attach a
-- reward photo (e.g. a picture of the merch prize). Add an optional image URL
-- alongside reward_label, uploaded to the existing "site-content" storage bucket.
-- =============================================================================

alter table challenges add column reward_image_url text;
