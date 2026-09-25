-- Custom profile image: when avatar_url is set it overrides the preset avatar_id.
-- The 'avatars' bucket and its storage.objects policies (avatars_public_read,
-- avatars_own_insert/update/delete, keyed on the <user id>/ folder) already
-- exist on the remote, so only the column is added here.
alter table public.subscribers add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;
