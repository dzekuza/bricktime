-- =============================================================================
-- Bricktime — Initial Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enum Types
-- ---------------------------------------------------------------------------
create type plan_tier as enum ('nano', 'mini', 'standard', 'pro', 'mega');
create type subscriber_status as enum ('active', 'paused', 'cancelled');
create type product_status as enum ('available', 'limited', 'sold_out');
create type order_status as enum ('processing', 'active', 'overdue', 'returned');
create type achievement_category as enum ('activity', 'social', 'collector', 'loyalty');
create type feed_event_type as enum ('checkin', 'build_photo', 'comment', 'like', 'achievement', 'first_drop', 'streak');

-- ---------------------------------------------------------------------------
-- Plans — subscription tier definitions
-- ---------------------------------------------------------------------------
create table plans (
  id          plan_tier    primary key,
  price       numeric(6,2) not null check (price > 0),
  bg_color    text         not null,
  text_color  text         not null,
  level       smallint     not null unique check (level between 1 and 5),
  created_at  timestamptz  not null default now()
);

comment on table plans is 'Subscription tier definitions (nano → mega).';

-- ---------------------------------------------------------------------------
-- Subscribers — one row per registered user (mirrors auth.users)
-- ---------------------------------------------------------------------------
create table subscribers (
  id           uuid          primary key references auth.users(id) on delete cascade,
  name         text          not null,
  email        text          not null unique,
  plan         plan_tier     not null default 'nano',
  status       subscriber_status not null default 'active',
  avatar_id    smallint      not null default 0 check (avatar_id between 0 and 4),
  avatar_bg    text          not null default '#FFD731',
  joined_at    timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

comment on table subscribers is 'Customer profiles — one per auth.users row.';

-- Trigger: keep updated_at current
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscribers_updated_at
  before update on subscribers
  for each row execute procedure touch_updated_at();

-- Index: look up by email (login, admin search)
create index idx_subscribers_email on subscribers(email);
-- Partial index: active subscriber queries (most frequent in admin)
create index idx_subscribers_active on subscribers(plan, joined_at desc)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Products — LEGO drops inventory
-- ---------------------------------------------------------------------------
create table products (
  id          integer      primary key, -- sequential drop number (26, 27, …)
  title       text         not null,
  subtitle    text         not null default '',
  description text,
  category    text         not null,
  year        smallint     not null,
  bricks      integer      not null check (bricks > 0),
  minifigs    text         not null default '0 minifigs',
  tier        plan_tier    not null,
  status      product_status not null default 'available',
  image_url   text,
  gallery     text[]       not null default '{}',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

comment on table products is 'LEGO drop inventory. id = sequential drop number.';

create trigger products_updated_at
  before update on products
  for each row execute procedure touch_updated_at();

-- Index: filter by tier + status (archive page, admin products list)
create index idx_products_tier_status on products(tier, status);
-- Index: latest drops first
create index idx_products_created_desc on products(created_at desc);

-- ---------------------------------------------------------------------------
-- Orders — individual rentals (one order = one product rental period)
-- ---------------------------------------------------------------------------
create table orders (
  id             uuid         primary key default gen_random_uuid(),
  subscriber_id  uuid         not null references subscribers(id) on delete cascade,
  product_id     integer      not null references products(id) on delete restrict,
  status         order_status not null default 'processing',
  start_date     date         not null,
  due_date       date         not null,
  amount         numeric(6,2) not null check (amount >= 0),
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now(),
  constraint orders_dates_check check (due_date > start_date)
);

comment on table orders is 'Rental transactions — each row is one drop period for one subscriber.';

create trigger orders_updated_at
  before update on orders
  for each row execute procedure touch_updated_at();

-- Index: subscriber order history (account page, admin subscriber sheet)
create index idx_orders_subscriber on orders(subscriber_id, created_at desc);
-- Index: product rental history
create index idx_orders_product on orders(product_id, status);
-- Partial index: overdue queries (admin dashboard alert)
create index idx_orders_overdue on orders(due_date)
  where status = 'overdue';
-- Partial index: active rentals (most frequent join in dashboard)
create index idx_orders_active on orders(subscriber_id, due_date)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Achievements — definitions (static lookup table)
-- ---------------------------------------------------------------------------
create table achievements (
  id          text                 primary key, -- e.g. 'daily_checkin'
  label       text                 not null,
  description text                 not null,
  points      integer              not null check (points > 0),
  category    achievement_category not null,
  color       text                 not null,
  icon        text                 not null,
  created_at  timestamptz          not null default now()
);

comment on table achievements is 'Achievement definitions — static catalog.';

-- ---------------------------------------------------------------------------
-- User Achievements — unlock events
-- ---------------------------------------------------------------------------
create table user_achievements (
  subscriber_id  uuid        not null references subscribers(id) on delete cascade,
  achievement_id text        not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (subscriber_id, achievement_id)
);

comment on table user_achievements is 'Which achievements each subscriber has unlocked.';

-- Index: look up all achievements for a user
create index idx_user_achievements_subscriber on user_achievements(subscriber_id, unlocked_at desc);

-- ---------------------------------------------------------------------------
-- Feed Items — community activity log
-- ---------------------------------------------------------------------------
create table feed_items (
  id             uuid            primary key default gen_random_uuid(),
  subscriber_id  uuid            not null references subscribers(id) on delete cascade,
  type           feed_event_type not null,
  body           text,
  image_url      text,
  drop_num       integer         references products(id) on delete set null,
  achievement_id text            references achievements(id) on delete set null,
  like_count     integer         not null default 0 check (like_count >= 0),
  created_at     timestamptz     not null default now()
);

comment on table feed_items is 'Community activity feed — one row per event.';

-- Index: chronological feed (main community page query)
create index idx_feed_items_created_desc on feed_items(created_at desc);
-- Index: per-user feed (profile page)
create index idx_feed_items_subscriber on feed_items(subscriber_id, created_at desc);
-- Partial index: photo posts (most expensive to render, filtered often)
create index idx_feed_items_photos on feed_items(created_at desc)
  where type = 'build_photo';

-- ---------------------------------------------------------------------------
-- Feed Likes — many-to-many (subscriber ↔ feed_item)
-- ---------------------------------------------------------------------------
create table feed_likes (
  feed_item_id  uuid        not null references feed_items(id) on delete cascade,
  subscriber_id uuid        not null references subscribers(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (feed_item_id, subscriber_id)
);

comment on table feed_likes is 'Tracks which subscribers liked which feed items.';

-- Index: check if current user liked a post (community page render)
create index idx_feed_likes_subscriber on feed_likes(subscriber_id, feed_item_id);

-- ---------------------------------------------------------------------------
-- Leaderboard (materialized — refreshed daily or on point change)
-- ---------------------------------------------------------------------------
create materialized view leaderboard as
  select
    s.id           as subscriber_id,
    s.name,
    s.avatar_id,
    s.avatar_bg,
    s.plan         as tier,
    count(distinct ua.achievement_id)          as achievement_count,
    coalesce(sum(a.points), 0)                 as total_points,
    count(distinct o.id) filter (where o.status in ('active','returned')) as drops_received,
    row_number() over (order by coalesce(sum(a.points), 0) desc) as rank
  from subscribers s
  left join user_achievements ua on ua.subscriber_id = s.id
  left join achievements a on a.id = ua.achievement_id
  left join orders o on o.subscriber_id = s.id
  where s.status = 'active'
  group by s.id, s.name, s.avatar_id, s.avatar_bg, s.plan
with data;

create unique index idx_leaderboard_subscriber on leaderboard(subscriber_id);
create index idx_leaderboard_rank on leaderboard(rank);

comment on materialized view leaderboard is
  'Pre-computed leaderboard. Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table plans              enable row level security;
alter table subscribers        enable row level security;
alter table products           enable row level security;
alter table orders             enable row level security;
alter table achievements       enable row level security;
alter table user_achievements  enable row level security;
alter table feed_items         enable row level security;
alter table feed_likes         enable row level security;

-- Plans — public read
create policy "plans_public_read" on plans
  for select using (true);

-- Products — public read
create policy "products_public_read" on products
  for select using (true);

-- Achievements — public read
create policy "achievements_public_read" on achievements
  for select using (true);

-- Subscribers — users see only their own row; admin role bypasses RLS
create policy "subscribers_select_own" on subscribers
  for select using (auth.uid() = id);

create policy "subscribers_update_own" on subscribers
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Orders — users see only their own orders
create policy "orders_select_own" on orders
  for select using (auth.uid() = subscriber_id);

-- User achievements — users see only their own
create policy "user_achievements_select_own" on user_achievements
  for select using (auth.uid() = subscriber_id);

-- Feed items — all authenticated users can read; authors can insert
create policy "feed_items_select_auth" on feed_items
  for select using (auth.role() = 'authenticated');

create policy "feed_items_insert_own" on feed_items
  for insert with check (auth.uid() = subscriber_id);

create policy "feed_items_update_own" on feed_items
  for update using (auth.uid() = subscriber_id);

-- Feed likes — authenticated users can read; users manage their own likes
create policy "feed_likes_select_auth" on feed_likes
  for select using (auth.role() = 'authenticated');

create policy "feed_likes_insert_own" on feed_likes
  for insert with check (auth.uid() = subscriber_id);

create policy "feed_likes_delete_own" on feed_likes
  for delete using (auth.uid() = subscriber_id);
