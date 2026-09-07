-- =============================================================================
-- Product reviews + public landing-page stats (2026-09-07)
--
-- The stats tile on the landing page (FAQ.tsx) was four hardcoded strings:
-- "12 400+" subscribers, "4.9" rating, "26" sets sent, "170" active sets.
-- Three of those can be counted from data we already hold. The rating had no
-- source anywhere in the schema — products.rating is text and entirely null —
-- so this adds the table that generates it.
--
-- Counts cannot be done client-side: subscribers is not readable by anon (see
-- 20260907120000_restrict_subscriber_pii), so a browser count would return 0.
-- public_stats is therefore security_invoker = false — it exposes four
-- aggregate numbers and never a single row, which is exactly the boundary we
-- want. Same pattern as leaderboard and community_feed.
-- =============================================================================

create table if not exists public.product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    integer not null references public.products (id) on delete cascade,
  subscriber_id uuid    not null references public.subscribers (id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  body          text,
  -- Reviews are held until an admin approves them; only approved rows count
  -- toward the public average, so the landing page cannot be moved by spam.
  approved      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- One review per member per set; editing replaces rather than stacks.
  unique (product_id, subscriber_id)
);

comment on table public.product_reviews is
  'Member ratings for a rented set. Only approved rows feed public_stats.';

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id);
create index if not exists product_reviews_approved_idx
  on public.product_reviews (approved) where approved;

drop trigger if exists product_reviews_updated_at on public.product_reviews;
create trigger product_reviews_updated_at
  before update on public.product_reviews
  for each row execute function public.touch_updated_at();

alter table public.product_reviews enable row level security;

-- Anyone may read approved reviews; they are public content on a product page.
drop policy if exists "product_reviews_public_read" on public.product_reviews;
create policy "product_reviews_public_read" on public.product_reviews
  for select to public
  using (approved);

-- A member may see and manage their own review even while it is pending.
drop policy if exists "product_reviews_select_own" on public.product_reviews;
create policy "product_reviews_select_own" on public.product_reviews
  for select to authenticated
  using ((select auth.uid()) = subscriber_id);

drop policy if exists "product_reviews_insert_own" on public.product_reviews;
create policy "product_reviews_insert_own" on public.product_reviews
  for insert to authenticated
  with check ((select auth.uid()) = subscriber_id);

drop policy if exists "product_reviews_update_own" on public.product_reviews;
create policy "product_reviews_update_own" on public.product_reviews
  for update to authenticated
  using ((select auth.uid()) = subscriber_id)
  -- A member editing their own review cannot self-approve it.
  with check ((select auth.uid()) = subscriber_id and not approved);

drop policy if exists "product_reviews_delete_own" on public.product_reviews;
create policy "product_reviews_delete_own" on public.product_reviews
  for delete to authenticated
  using ((select auth.uid()) = subscriber_id);

drop policy if exists "product_reviews_admin_all" on public.product_reviews;
create policy "product_reviews_admin_all" on public.product_reviews
  for all to authenticated
  using (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
  with check (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

-- ---- public landing-page stats ---------------------------------------------
-- Exactly one row, four aggregates, no identifying data.
drop view if exists public.public_stats;

create view public.public_stats as
  select
    (select count(*) from public.subscribers where status = 'active')::integer
      as active_subscribers,
    (select count(*) from public.orders
      where status = any (array['active'::order_status, 'returned'::order_status]))::integer
      as sets_sent,
    (select count(*) from public.products where status <> 'sold_out')::integer
      as active_sets,
    (select round(avg(rating)::numeric, 1) from public.product_reviews where approved)
      as average_rating,
    (select count(*) from public.product_reviews where approved)::integer
      as review_count;

alter view public.public_stats set (security_invoker = false);

grant select on public.public_stats to anon, authenticated;
grant select on public.product_reviews to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;

-- Down migration (manual rollback):
-- drop view if exists public.public_stats;
-- drop table if exists public.product_reviews;
