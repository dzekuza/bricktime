alter table subscribers
  add column if not exists home_delivery boolean not null default false;
