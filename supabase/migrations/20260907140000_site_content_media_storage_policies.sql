-- =============================================================================
-- Storage policies for the site-content and site-media buckets (2026-09-07)
--
-- Both buckets had RLS enabled on storage.objects but no policies at all, so
-- every write was denied. Uploads from the admin app's Hero, Marquee,
-- Challenges and Merch tabs failed with "new row violates row-level security
-- policy"; the files currently in these buckets were put there through the
-- dashboard, which uses the service role and bypasses RLS.
--
-- Write access is gated on app_metadata.role = 'admin' rather than plain
-- `authenticated`, because only the admin app writes here and these are
-- site-wide assets — the homepage hero video, marquee avatars, merch and
-- challenge images. Letting any signed-in member replace them would be a
-- defacement vector. This matches how the corresponding tables are gated
-- (achievements_admin_write, challenges_admin_write, merch_admin_write).
--
-- Both buckets are public = true, so reads stay open to anon.
-- =============================================================================

-- ---- site-content ----------------------------------------------------------
drop policy if exists "site_content_public_read" on storage.objects;
create policy "site_content_public_read" on storage.objects
  for select to public
  using (bucket_id = 'site-content');

drop policy if exists "site_content_admin_insert" on storage.objects;
create policy "site_content_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-content'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

drop policy if exists "site_content_admin_update" on storage.objects;
create policy "site_content_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-content'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'site-content'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

drop policy if exists "site_content_admin_delete" on storage.objects;
create policy "site_content_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-content'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

-- ---- site-media ------------------------------------------------------------
drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read" on storage.objects
  for select to public
  using (bucket_id = 'site-media');

drop policy if exists "site_media_admin_insert" on storage.objects;
create policy "site_media_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

drop policy if exists "site_media_admin_update" on storage.objects;
create policy "site_media_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-media'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'site-media'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-media'
    and ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

-- Down migration (manual rollback):
-- drop policy if exists "site_content_public_read"   on storage.objects;
-- drop policy if exists "site_content_admin_insert"  on storage.objects;
-- drop policy if exists "site_content_admin_update"  on storage.objects;
-- drop policy if exists "site_content_admin_delete"  on storage.objects;
-- drop policy if exists "site_media_public_read"     on storage.objects;
-- drop policy if exists "site_media_admin_insert"    on storage.objects;
-- drop policy if exists "site_media_admin_update"    on storage.objects;
-- drop policy if exists "site_media_admin_delete"    on storage.objects;
