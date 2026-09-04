-- Products: split the € price from the Briksiai value, and add age + stock.
--
-- The storefront rendered "Kaina" from `value`, so a set's price and its
-- Briksiai cost (what counts against a subscriber's monthly budget) were forced
-- to be the same number. "Amžius" and the archive age filter read `min_age`,
-- a column that never existed, so the spec always rendered "—" and the filter
-- matched everything.

alter table public.products
  add column if not exists price numeric(10, 2),
  add column if not exists min_age integer,
  add column if not exists stock integer not null default 0 check (stock >= 0);

-- Existing rows carry the conflated number in `value`; copy it over so nothing
-- renders "—" after the split.
update public.products set price = value where price is null;

comment on column public.products.price is 'Retail price in EUR, shown as "Kaina".';
comment on column public.products.value is 'Briksiai cost counted against a subscriber''s monthly budget ("Briksių vertė").';
comment on column public.products.min_age is 'Manufacturer minimum age; backs the "Amžius" spec and the archive age filter.';
comment on column public.products.stock is 'Units physically available to rent out.';
