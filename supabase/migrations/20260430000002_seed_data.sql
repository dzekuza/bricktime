-- =============================================================================
-- Bricktime — Seed Data (matches existing mock data in both apps)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
insert into plans (id, price, bg_color, text_color, level) values
  ('nano',     9.00,  '#F5F1EB', '#001B21', 1),
  ('mini',    14.00,  '#FFAEE7', '#001B21', 2),
  ('standard',24.00,  '#FFD731', '#001B21', 3),
  ('pro',     35.00,  '#4DA2FF', '#001B21', 4),
  ('mega',    55.00,  '#FB4903', '#F5F1EB', 5);

-- ---------------------------------------------------------------------------
-- Products / Drops
-- ---------------------------------------------------------------------------
insert into products (id, title, subtitle, description, category, year, bricks, minifigs, tier, status) values
  (26, 'Mailbox Row',       '+ Postman Otto',     'Five-storey apartment block with a working mailbox door, three balconies, and the first crossover with set 14. Postman Otto is numbered 1/3,500.', 'Cityscape',  2026, 312, '2 minifigs', 'standard', 'available'),
  (25, 'The Greenhouse',    '+ Lily the Gardener', 'A glass-walled urban greenhouse with 48 plant types, a rooftop water tank, and Lily — the first minifig with a trowel and seed packet.', 'Cityscape',  2026, 268, '1 minifig',  'mini',     'available'),
  (24, 'Donut Diner',       '+ Chef Marcel',       'Retro 1950s diner with a neon sign, swivel bar stools, and a fully stocked kitchen. Chef Marcel wears a limited-edition paper hat.', 'Cityscape',  2025, 295, '2 minifigs', 'standard', 'available'),
  (23, 'Lighthouse Bay',    '+ Keeper Oda',        'Coastal lighthouse with rotating beacon, rocky outcrop, tide pool diorama, and Keeper Oda holding a hand-painted lantern.', 'Nature',     2025, 441, '1 minifig',  'pro',      'available'),
  (22, 'Grand Prix Pit',    '+ Race Crew',          'Formula pit lane with hydraulic lift, tyre wall, timing tower, and four crew minifigs in branded race suits.', 'Vehicles',   2025, 387, '4 minifigs', 'pro',      'limited'),
  (21, 'Lighthouse',        '',                     null,                                                                                                                                   'Nature',     2025, 292, '1 minifig',  'standard', 'available'),
  (20, 'Corner Bookshop',   '+ Librarian Ines',    'Three-floor bookshop with a working sliding ladder, reading nook, and a cat perched on the first-edition shelf.', 'Cityscape',  2024, 356, '2 minifigs', 'standard', 'available'),
  (19, 'Desert Outpost',    '+ Scout Team',        'Remote desert research station with solar panels, a sand buggy, and three scientist minifigs including the first with a data tablet.', 'Nature',     2024, 512, '3 minifigs', 'mega',     'sold_out'),
  (18, 'Canal Houseboat',   '+ Captain Vera',      'Floating houseboat with foldout deck, a working gangplank, flowerpots, and Captain Vera steering a traditional canal boat.', 'Cityscape',  2024, 278, '2 minifigs', 'mini',     'available');

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
insert into achievements (id, label, description, points, category, color, icon) values
  ('daily_checkin',  'Kasdienė apsilankymas',  'Aplankyk puslapį bet kurią dieną',           10, 'activity',  '#FFD731', '☀️'),
  ('week_streak',    'Savaitės serija',         'Apsilankyk 7 dienas iš eilės',               50, 'activity',  '#FFD731', '🔥'),
  ('drop_streak_3',  '3 lašai iš eilės',        'Gauk 3 lašus iš eilės be pertraukos',        75, 'collector', '#4DA2FF', '📦'),
  ('first_drop',     'Pirmasis lašas',          'Gauk savo pirmąjį lašą',                     25, 'collector', '#5DDB9C', '🎉'),
  ('collector_5',    'Kolekcionierius',         'Surink 5 skirtingus lašus',                  60, 'collector', '#4DA2FF', '🧱'),
  ('build_photo',    'Fotografas',              'Paskelbk nuotrauką su surinktu rinkiniu',    30, 'social',    '#FFAEE7', '📸'),
  ('commenter',      'Komentatorius',           'Palik 10 komentarų bendruomenėje',           20, 'social',    '#FFAEE7', '💬'),
  ('liker',          'Mėgstamas',               'Gauk 20 patinka ženklų savo įrašams',        40, 'social',    '#FFAEE7', '❤️'),
  ('old_member',     'Veteranas',               'Būk narys ilgiau nei metus',                100, 'loyalty',   '#FB4903', '🏆');

-- ---------------------------------------------------------------------------
-- Auth Users — seed into auth.users so FK constraint on subscribers is satisfied.
-- Passwords are all "password123" (bcrypt hash). Local dev only.
-- ---------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anna@example.com',        '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tomas@example.com',        '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lena@example.com',         '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mia@example.com',          '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jonas@example.com',        '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia@example.com',        '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lukas@example.com',        '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma@example.com',         '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nils@example.com',         '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex.kim@example.com',     '$2a$10$PznXR5VSGkgHa1bGDFiGsOxMGm7gQ1VmyBiBgaxuAqBqADgbwI/3u', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', '');

-- ---------------------------------------------------------------------------
-- Subscribers — mirrors auth.users above
-- ---------------------------------------------------------------------------
insert into subscribers (id, name, email, plan, status, avatar_id, avatar_bg, joined_at) values
  ('a0000000-0000-0000-0000-000000000001', 'Anna Kowalski', 'anna@example.com',   'pro',      'active',    3, '#4DA2FF', '2024-03-12T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000002', 'Tomas Bauer',   'tomas@example.com',  'standard', 'active',    0, '#FFD731', '2024-04-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003', 'Lena Müller',   'lena@example.com',   'mega',     'active',    1, '#FB4903', '2024-05-18T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000004', 'Mia Nowak',     'mia@example.com',    'mini',     'paused',    4, '#5C4ADE', '2024-06-30T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000005', 'Jonas Berg',    'jonas@example.com',  'pro',      'active',    2, '#001B21', '2024-07-22T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000006', 'Sofia Ricci',   'sofia@example.com',  'standard', 'active',    0, '#FFD731', '2024-08-05T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000007', 'Lukas Becker',  'lukas@example.com',  'nano',     'cancelled', 1, '#FFAEE7', '2024-09-14T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000008', 'Emma Novak',    'emma@example.com',   'mega',     'active',    3, '#4DA2FF', '2024-10-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000009', 'Nils Larsen',   'nils@example.com',   'standard', 'active',    2, '#5DDB9C', '2024-11-17T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000010', 'Alex Kim',      'alex.kim@example.com','standard','active',    3, '#4DA2FF', '2025-03-01T00:00:00Z');

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
insert into orders (id, subscriber_id, product_id, status, start_date, due_date, amount) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 26, 'active',     '2026-05-01', '2026-06-01', 28.00),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 26, 'processing', '2026-05-03', '2026-06-03', 49.00),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 25, 'active',     '2026-04-15', '2026-05-15', 35.00),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 24, 'returned',   '2026-03-01', '2026-04-01', 19.00),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 23, 'overdue',    '2026-03-10', '2026-04-10', 24.00),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000009', 22, 'returned',   '2026-02-01', '2026-03-01', 24.00),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000008', 21, 'active',     '2026-04-20', '2026-05-20', 49.00),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000010', 26, 'processing', '2026-05-05', '2026-06-05', 24.00);

-- Alex Kim's full rental history (account page mock data)
insert into orders (id, subscriber_id, product_id, status, start_date, due_date, amount) values
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000010', 25, 'returned',   '2026-03-01', '2026-04-01', 24.00),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 24, 'returned',   '2026-02-01', '2026-03-01', 24.00),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000010', 21, 'returned',   '2025-12-01', '2026-01-01', 24.00);

-- ---------------------------------------------------------------------------
-- User Achievements (Alex Kim = sub_010)
-- ---------------------------------------------------------------------------
insert into user_achievements (subscriber_id, achievement_id, unlocked_at) values
  ('a0000000-0000-0000-0000-000000000010', 'daily_checkin', '2025-03-15T10:00:00Z'),
  ('a0000000-0000-0000-0000-000000000010', 'first_drop',    '2025-03-20T14:00:00Z'),
  ('a0000000-0000-0000-0000-000000000010', 'build_photo',   '2025-04-01T09:00:00Z'),
  ('a0000000-0000-0000-0000-000000000010', 'commenter',     '2025-04-10T16:00:00Z');

-- Lukas (sub_001 in community = u1 → seeding as sub_001 for leaderboard)
insert into user_achievements (subscriber_id, achievement_id, unlocked_at) values
  ('a0000000-0000-0000-0000-000000000001', 'daily_checkin', '2024-04-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'week_streak',   '2024-04-08T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'old_member',    '2025-03-12T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'first_drop',    '2024-04-15T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'collector_5',   '2024-09-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'build_photo',   '2024-05-10T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'commenter',     '2024-06-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'liker',         '2024-07-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'drop_streak_3', '2024-10-01T00:00:00Z');

-- ---------------------------------------------------------------------------
-- Feed Items (community page mock data)
-- ---------------------------------------------------------------------------
insert into feed_items (id, subscriber_id, type, body, drop_num, like_count, created_at) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'build_photo',  'Galiausiai surinkau Mailbox Row! Postman Otto — mano mėgstamiausias miniukas iki šiol. 🧱', 26, 14, '2026-04-30T15:32:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'checkin',      null, null, 3, '2026-04-30T14:15:00Z'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000010', 'achievement',  null, null, 0, '2026-04-30T13:00:00Z'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'comment',      'Ar kas jau gavo Greenhouse? Smalsauju dėl augalų!', 25, 7, '2026-04-30T11:45:00Z'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000008', 'first_drop',   null, 26, 5, '2026-04-29T18:20:00Z'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'streak',       null, null, 2, '2026-04-29T09:00:00Z'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000006', 'build_photo',  'Donut Diner baigtas! Chef Marcel atrodo tobulai virš lentynos.', 24, 11, '2026-04-28T20:10:00Z'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000009', 'comment',      'Grand Prix Pit — geriausias iki šiol pagal smulkmenas.', 22, 4, '2026-04-28T14:30:00Z'),
  ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'like',         null, null, 1, '2026-04-27T22:00:00Z'),
  ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'checkin',      null, null, 0, '2026-04-27T08:45:00Z');

-- Attach achievement to Alex's feed item
update feed_items
  set achievement_id = 'build_photo'
  where id = 'c0000000-0000-0000-0000-000000000003';

-- ---------------------------------------------------------------------------
-- Refresh leaderboard materialized view
-- ---------------------------------------------------------------------------
refresh materialized view leaderboard;
