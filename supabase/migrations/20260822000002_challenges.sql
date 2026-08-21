-- =============================================================================
-- Challenges (2026-08-22)
-- Time-boxed community goals (e.g. "collect 20 likes this month"), distinct
-- from the permanent/cumulative achievements system. Admin-managed only:
-- admin creates/closes challenges and manually marks a member's challenge
-- complete + rewarded — no automatic reset or auto-granting. Progress is
-- computed live (date-windowed count against feed_items/feed_likes, same
-- shape as evaluate_achievements()'s per-metric counts) rather than stored,
-- since existing RLS already lets members read their own activity rows and
-- admins read everyone's.
-- =============================================================================

create table challenges (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  description  text,
  metric       text        not null
    check (metric in ('checkins', 'checkin_streak', 'comments_written', 'photos_shared', 'likes_received', 'membership_days')),
  target_value integer     not null check (target_value > 0),
  reward_label text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at),
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

comment on table challenges is 'Time-boxed community goals. Admin-managed: completion/reward is granted manually, not automatically.';

create index idx_challenges_active on challenges(is_active, ends_at);

alter table challenges enable row level security;

create policy "challenges_select_auth" on challenges
  for select using ((select auth.role()) = 'authenticated');

create policy "challenges_admin_write" on challenges
  for insert with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "challenges_admin_update" on challenges
  for update using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "challenges_admin_delete" on challenges
  for delete using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create table challenge_completions (
  id             uuid        primary key default gen_random_uuid(),
  challenge_id   uuid        not null references challenges(id) on delete cascade,
  subscriber_id  uuid        not null references subscribers(id) on delete cascade,
  completed_at   timestamptz not null default now(),
  reward_granted boolean     not null default false,
  unique (challenge_id, subscriber_id)
);

comment on table challenge_completions is 'Admin-granted record that a member completed a challenge. No trigger inserts these — admin marks completion manually.';

create index idx_challenge_completions_subscriber on challenge_completions(subscriber_id);

alter table challenge_completions enable row level security;

create policy "challenge_completions_select_own" on challenge_completions
  for select using (
    (select auth.uid()) = subscriber_id
    or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
  );

create policy "challenge_completions_admin_write" on challenge_completions
  for insert with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "challenge_completions_admin_update" on challenge_completions
  for update using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

create policy "challenge_completions_admin_delete" on challenge_completions
  for delete using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));
