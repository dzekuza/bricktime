-- =============================================================================
-- Merch: admin write access + image gallery (2026-08-27)
-- Two gaps behind "no option to upload a merch image":
--   1. merch_items only ever had `merch_public_read` (status in active/
--      coming-soon). The admin dashboard could neither see drafts nor write a
--      row at all -- which is why its Merch page was still running on mock
--      state and nothing an admin typed there ever reached the storefront.
--   2. The table carries a single `image_url`, so there was nowhere to put the
--      additional shots a product page wants.
-- Policies follow the challenges/achievements pattern: app_metadata.role.
-- =============================================================================

alter table merch_items
  add column if not exists image_urls text[] not null default '{}';

comment on column merch_items.image_url is 'Primary/hero image shown in listings and as the default PDP image.';
comment on column merch_items.image_urls is 'Additional gallery images, shown as PDP thumbnails after the hero.';

drop policy if exists "merch_admin_read" on merch_items;
create policy "merch_admin_read" on merch_items
  for select using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

drop policy if exists "merch_admin_write" on merch_items;
create policy "merch_admin_write" on merch_items
  for insert with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

drop policy if exists "merch_admin_update" on merch_items;
create policy "merch_admin_update" on merch_items
  for update using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

drop policy if exists "merch_admin_delete" on merch_items;
create policy "merch_admin_delete" on merch_items
  for delete using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));
