-- =============================================================================
-- Create the subscribers row on signup (2026-08-27)
-- AuthForm called `supabase.from("subscribers").upsert(...)` straight after
-- signUp, but `subscribers` has RLS enabled with only select/update policies --
-- there has never been an insert policy -- so that write was always denied,
-- and its error was discarded. A first-time member therefore ended up
-- authenticated with no subscribers row, which silently broke everything
-- keyed off it:
--   * the daily check-in insert failed the feed_items.subscriber_id FK,
--   * evaluate_achievements() bails on `joined_at is null`, so daily_checkin
--     never unlocked and no points were ever awarded,
--   * the leaderboard joins subscribers, so the member was absent and read 0.
-- Mirror auth.users from a trigger instead: it runs as the table owner, so it
-- is not subject to RLS, and it fires whether or not the signup returned a
-- session (email confirmation on).
-- =============================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.subscribers (id, name, email, avatar_id, avatar_bg)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email,
    floor(random() * 5)::smallint,
    (array['#FFD731', '#FB4903', '#4DA2FF', '#5DDB9C', '#FFAEE7'])[floor(random() * 5) + 1]
  )
  -- Untargeted: covers the email unique constraint as well as the id PK, so a
  -- re-used address can never make signup itself fail.
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_auth_user();

-- Backfill everyone who registered while the client-side upsert was silently
-- failing. joined_at defaults to now(), so membership_days starts from here --
-- retroactively awarding loyalty points isn't this migration's business.
insert into public.subscribers (id, name, email, avatar_id, avatar_bg)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)),
  u.email,
  floor(random() * 5)::smallint,
  (array['#FFD731', '#FB4903', '#4DA2FF', '#5DDB9C', '#FFAEE7'])[floor(random() * 5) + 1]
from auth.users u
where u.email is not null
  and not exists (select 1 from public.subscribers s where s.id = u.id)
  and not exists (select 1 from public.subscribers s where s.email = u.email)
on conflict do nothing;
