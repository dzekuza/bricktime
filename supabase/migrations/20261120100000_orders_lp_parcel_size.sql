-- Locker slot the admin picked for the outbound parcel; the return label reuses it.
alter table public.orders
  add column if not exists lp_parcel_size text
  check (lp_parcel_size in ('XS', 'S', 'M', 'L', 'XL'));
