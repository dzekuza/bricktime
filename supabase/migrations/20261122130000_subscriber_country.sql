-- Delivery country for the profile address. ISO 3166-1 alpha-2; the storefront
-- offers the Baltic states, and existing members are all Lithuanian.
alter table public.subscribers
  add column if not exists country text not null default 'LT'
  check (country in ('LT', 'LV', 'EE'));

comment on column public.subscribers.country is
  'ISO country code of the profile address (LT, LV, EE).';

-- Rollback: alter table public.subscribers drop column country;
