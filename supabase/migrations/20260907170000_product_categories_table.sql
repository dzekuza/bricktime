-- =============================================================================
-- Admin-managed product categories / temos (2026-09-07)
--
-- The theme list was a hardcoded TypeScript array duplicated in two files —
-- src/lib/series.ts for the storefront filter and admin/src/lib/series.ts for
-- the product form's Category dropdown. Adding, renaming or retiring a theme
-- meant editing both copies and redeploying both apps, and the two could drift
-- apart silently. products.category was free text with no constraint, so a
-- typo in either place produced a category that matched no filter.
--
-- The name is the primary key rather than a surrogate id, because
-- products.category already stores the name and every filter compares by it.
-- That keeps this migration from having to rewrite existing product rows, and
-- ON UPDATE CASCADE then makes a rename propagate to products automatically.
-- ON DELETE RESTRICT stops a category disappearing out from under products
-- that still use it — the admin surfaces that as "in use" instead.
--
-- `active` hides a theme from the storefront filter without deleting it, so a
-- seasonal theme can be retired and brought back without losing its products.
-- =============================================================================

create table if not exists public.product_categories (
  name       text primary key,
  sort_order integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.product_categories is
  'LEGO themes shown in the storefront filter and the admin product form.';
comment on column public.product_categories.active is
  'Hidden from the storefront filter when false; existing products keep it.';

-- Seed with the 20 values the hardcoded array held, in its original order.
insert into public.product_categories (name, sort_order) values
  ('Architektūra', 10), ('Creator 3in1', 20), ('Dekoracijos', 30),
  ('Disney', 40), ('Dreamz', 50), ('Harry Potter', 60),
  ('Icons', 70), ('Ideas', 80), ('Marvel', 90),
  ('Minecraft', 100), ('Minifigūrėlės', 110), ('Pokemonai', 120),
  ('Star Wars', 130), ('Technic', 140), ('Batman', 150),
  ('City', 160), ('Jurassic World', 170), ('Super Mario', 180),
  ('Creator Expert', 190), ('Kita', 200)
on conflict (name) do nothing;

-- Anything already on a product but missing from that list would otherwise
-- fail the foreign key below. Adopt it rather than lose the association.
insert into public.product_categories (name, sort_order)
select distinct p.category, 999
from public.products p
where p.category is not null
  and p.category <> ''
  and not exists (
    select 1 from public.product_categories c where c.name = p.category
  )
on conflict (name) do nothing;

alter table public.products
  drop constraint if exists products_category_fkey;

alter table public.products
  add constraint products_category_fkey
  foreign key (category) references public.product_categories (name)
  on update cascade
  on delete restrict;

alter table public.product_categories enable row level security;

-- The filter is public, so the list has to be readable by anon.
drop policy if exists "product_categories_public_read" on public.product_categories;
create policy "product_categories_public_read" on public.product_categories
  for select to public
  using (true);

drop policy if exists "product_categories_admin_all" on public.product_categories;
create policy "product_categories_admin_all" on public.product_categories
  for all to authenticated
  using (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
  with check (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;

-- Down migration (manual rollback):
-- alter table public.products drop constraint if exists products_category_fkey;
-- drop table if exists public.product_categories;
