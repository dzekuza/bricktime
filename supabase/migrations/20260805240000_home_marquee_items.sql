-- Editable marquee strip (scrolling text + avatar items) shown on the landing
-- page, managed from the admin dashboard's /content page. Seeded with the copy
-- previously hardcoded in src/components/Marquee.tsx so nothing changes
-- visually on deploy.

create table public.home_marquee_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  avatar_url text,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.home_marquee_items enable row level security;

create policy home_marquee_items_public_read on public.home_marquee_items
  for select using (true);

create policy home_marquee_items_admin_write on public.home_marquee_items
  for all
  using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

insert into public.home_marquee_items (text, avatar_url, sort_order) values
  ('STATYK', '/avatars/avatar-classic.png', 0),
  ('RINK', '/avatars/avatar-beanie.png', 1),
  ('KARTOK', '/avatars/avatar-ninja.png', 2),
  ('NAUJAS PRODUKTAS KAS SAVAITĘ', '/avatars/avatar-robot.png', 3),
  ('NEMOKAMAS PRISTATYMAS', '/avatars/avatar-wizard.png', 4),
  ('PRALEISK BET KADA', '/avatars/avatar-classic.png', 5);

-- Down migration (manual rollback):
-- drop table public.home_marquee_items;
