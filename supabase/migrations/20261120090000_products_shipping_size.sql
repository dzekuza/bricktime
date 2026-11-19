-- LP Express locker slot a set needs; the return label is sized from it.
alter table public.products
  add column if not exists shipping_size text not null default 'S'
  check (shipping_size in ('XS', 'S', 'M', 'L', 'XL'));
