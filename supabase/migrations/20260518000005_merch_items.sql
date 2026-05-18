-- Merch products (hoodies, t-shirts, etc.) sold directly by BRICKTIME.
create table merch_items (
  id          uuid         primary key default gen_random_uuid(),
  name        text         not null,
  slug        text         not null unique,
  type        text         not null check (type in ('hoodie', 't-shirt')),
  description text         not null default '',
  price       numeric(10,2) not null check (price >= 0),
  sizes       text[]       not null default '{}',
  stock       integer      not null default 0 check (stock >= 0),
  bg          text         not null default '#001B21',
  image_url   text,
  status      text         not null default 'draft' check (status in ('draft', 'coming-soon', 'active')),
  sort_order  integer      not null default 0,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

comment on table merch_items is 'BRICKTIME branded merchandise for direct sale.';

create trigger merch_items_updated_at
  before update on merch_items
  for each row execute procedure touch_updated_at();

create index idx_merch_status on merch_items(status, sort_order);

alter table merch_items enable row level security;

-- Public read for active / coming-soon items
create policy "merch_public_read" on merch_items
  for select using (status in ('active', 'coming-soon'));

-- Seed initial products
insert into merch_items (name, slug, type, description, price, sizes, stock, bg, status, sort_order) values
  (
    'BRICKTIME Classic Hoodie',
    'classic-hoodie',
    'hoodie',
    'Unisex džemperis su gobtuvu. 100% medvilnė, oversized fit. BRICKTIME logo ant krūtinės.',
    49.00,
    array['S','M','L','XL'],
    0,
    '#001B21',
    'coming-soon',
    1
  ),
  (
    'BRICKTIME Brick Tee',
    'brick-tee',
    't-shirt',
    'Klasikiniai marškinėliai. 100% medvilnė, regular fit. Brick logotipas ant nugaros.',
    29.00,
    array['S','M','L','XL','XXL'],
    0,
    '#FFD731',
    'coming-soon',
    2
  );
