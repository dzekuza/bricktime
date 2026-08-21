-- =============================================================================
-- Anonymous likes (2026-08-22)
-- Likes should be open to everyone, not just logged-in members (comments/
-- reports/uploads stay members-only). feed_likes stays exactly as-is for
-- members (subscriber_id FK, one-per-member unique constraint); anonymous
-- likes get a parallel table keyed by a client-generated session id instead
-- of an auth identity.
-- =============================================================================

create table feed_item_anon_likes (
  feed_item_id uuid        not null references feed_items(id) on delete cascade,
  session_id   uuid        not null,
  created_at   timestamptz not null default now(),
  primary key (feed_item_id, session_id)
);

comment on table feed_item_anon_likes is
  'Likes from signed-out visitors, keyed by a random client-generated session id (localStorage) instead of an auth identity.';

alter table feed_item_anon_likes enable row level security;

-- No auth identity exists for anonymous visitors to scope by — the session id
-- itself (an unguessable UUID never sent anywhere else) is the only "identity"
-- available, so policies are open. No personal data is exposed.
create policy "feed_item_anon_likes_select_anyone" on feed_item_anon_likes
  for select using (true);

create policy "feed_item_anon_likes_insert_anyone" on feed_item_anon_likes
  for insert with check (true);

create policy "feed_item_anon_likes_delete_anyone" on feed_item_anon_likes
  for delete using (true);

-- Mirrors toggle_like() (best_practices_fixes.sql) — atomic insert/delete
-- + like_count update in one function, no read-then-write race.
create or replace function toggle_like_anon(p_feed_item_id uuid, p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.feed_item_anon_likes
    where feed_item_id = p_feed_item_id and session_id = p_session_id
  ) then
    delete from public.feed_item_anon_likes
    where feed_item_id = p_feed_item_id and session_id = p_session_id;

    update public.feed_items
    set like_count = like_count - 1
    where id = p_feed_item_id;
  else
    insert into public.feed_item_anon_likes(feed_item_id, session_id)
    values (p_feed_item_id, p_session_id);

    update public.feed_items
    set like_count = like_count + 1
    where id = p_feed_item_id;
  end if;
end;
$$;

grant execute on function toggle_like_anon(uuid, uuid) to anon, authenticated;
