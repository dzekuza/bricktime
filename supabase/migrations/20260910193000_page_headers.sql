-- =============================================================================
-- Page header images for Archive/Merch/GiftCards/Community (2026-09-10)
--
-- Archive.tsx, Merch.tsx, GiftCards.tsx and Community.tsx each render a hero
-- section whose photo was hardcoded to a static file in public/images/
-- (build-castle.jpg, build-sailboat.jpg, build-spaceship.jpg,
-- build-cactus.jpg). Marketing needs to replace these from the admin app
-- without a code deploy, mirroring how home_content.hero_poster_url already
-- works for the homepage.
--
-- One row per page rather than four boolean-ish columns on some shared table,
-- since this is a flat 1:1 slug -> image mapping and new pages will need the
-- same shape. image_url is nullable so a page falls back to its bundled
-- static asset until an admin uploads a replacement.
-- =============================================================================

create table public.page_headers (
  slug text primary key check (slug in ('archive', 'merch', 'gift_cards', 'community')),
  image_url text,
  updated_at timestamptz not null default now()
);

insert into public.page_headers (slug) values
  ('archive'), ('merch'), ('gift_cards'), ('community');

alter table public.page_headers enable row level security;

create policy "page_headers_public_read" on public.page_headers
  for select to public
  using (true);

create policy "page_headers_admin_write" on public.page_headers
  for all to public
  using (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
  with check (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Down migration (manual rollback):
-- drop table if exists public.page_headers;
