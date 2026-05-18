-- Missing part requests submitted by subscribers on active rentals.
create table missing_part_requests (
  id            uuid         primary key default gen_random_uuid(),
  subscriber_id uuid         not null references subscribers(id) on delete cascade,
  order_id      uuid         not null references orders(id) on delete cascade,
  product_id    integer      not null references products(id) on delete restrict,
  lego_set_code text         not null,
  part_code     text         not null,
  bag_number    text         not null,
  quantity      integer      not null check (quantity > 0),
  status        text         not null default 'pending' check (status in ('pending', 'resolved')),
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

comment on table missing_part_requests is 'Subscriber reports of missing LEGO pieces in active rentals.';

create trigger missing_part_requests_updated_at
  before update on missing_part_requests
  for each row execute procedure touch_updated_at();

create index idx_mpr_subscriber on missing_part_requests(subscriber_id, created_at desc);
create index idx_mpr_status     on missing_part_requests(status, created_at desc);

alter table missing_part_requests enable row level security;

-- Subscribers can read and insert their own requests; no update/delete from client
create policy "mpr_select_own" on missing_part_requests
  for select using ((select auth.uid()) = subscriber_id);

create policy "mpr_insert_own" on missing_part_requests
  for insert with check ((select auth.uid()) = subscriber_id);
