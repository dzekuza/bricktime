-- =============================================================================
-- Coming soon — email waitlist
-- =============================================================================

create table coming_soon_subscribers (
  id         uuid         primary key default gen_random_uuid(),
  email      text         not null unique,
  created_at timestamptz  not null default now()
);

comment on table coming_soon_subscribers is 'Emails collected from the coming-soon gate before launch.';

alter table coming_soon_subscribers enable row level security;

create policy "Anyone can subscribe"
  on coming_soon_subscribers for insert
  to anon, authenticated
  with check (true);
