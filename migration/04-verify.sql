-- Parity snapshot. Run against SOURCE and TARGET and diff the two outputs:
--   psql "$SOURCE_DB_URL" -X -q -f 04-verify.sql > /tmp/source.txt
--   psql "$TARGET_DB_URL" -X -q -f 04-verify.sql > /tmp/target.txt
--   diff /tmp/source.txt /tmp/target.txt && echo "PARITY OK"
--
-- Read-only. Deliberately excludes anything that legitimately differs between
-- projects (project ref, timestamps, storage.objects ids, JWT secrets).

\pset format unaligned
\pset tuples_only on
\pset fieldsep ' | '

select '== ROW COUNTS ==';
select relname || ' = ' || n_live_tup
from pg_stat_user_tables
where schemaname = 'public'
order by relname;

select '== AUTH ==';
select 'auth.users = ' || count(*) from auth.users;
select 'auth.identities = ' || count(*) from auth.identities;
select 'confirmed = ' || count(*) from auth.users where confirmed_at is not null;
select 'with_password = ' || count(*) from auth.users
  where encrypted_password is not null and encrypted_password <> '';
-- Hash fingerprint proves passwords survived without exposing them.
select 'password_hash_fingerprint = ' || md5(string_agg(encrypted_password, '' order by id))
from auth.users where encrypted_password is not null;
select 'user_emails_fingerprint = ' || md5(string_agg(lower(email), '' order by lower(email)))
from auth.users where email is not null;

select '== TABLES ==';
select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

select '== COLUMNS ==';
select table_name || '.' || column_name || ' ' || data_type ||
       coalesce(' default=' || column_default, '') ||
       ' null=' || is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, column_name;

select '== RLS ENABLED ==';
select c.relname || ' = ' || c.relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

select '== POLICIES ==';
select tablename || ' :: ' || policyname || ' :: ' || cmd || ' :: ' ||
       coalesce(qual, '-') || ' :: ' || coalesce(with_check, '-')
from pg_policies where schemaname = 'public'
order by tablename, policyname;

select '== FUNCTIONS ==';
select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' ||
       ' security_definer=' || p.prosecdef ||
       ' search_path=' || coalesce(array_to_string(p.proconfig, ','), 'MUTABLE')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by 1;

select '== TRIGGERS ==';
select c.relname || ' :: ' || t.tgname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal and n.nspname in ('public', 'auth')
order by 1;

select '== VIEWS ==';
select table_name from information_schema.views
where table_schema = 'public' order by table_name;

select '== INDEXES ==';
select indexname || ' :: ' || indexdef
from pg_indexes where schemaname = 'public'
order by indexname;

select '== CONSTRAINTS ==';
select conrelid::regclass || ' :: ' || conname || ' :: ' || pg_get_constraintdef(oid)
from pg_constraint
where connamespace = 'public'::regnamespace
order by 1, 2;

select '== EXTENSIONS ==';
select extname from pg_extension order by extname;

select '== STORAGE BUCKETS ==';
select id || ' public=' || public || ' limit=' || coalesce(file_size_limit::text, 'none')
from storage.buckets order by id;

select '== STORAGE OBJECT COUNTS ==';
select bucket_id || ' = ' || count(*) || ' objects, ' ||
       coalesce(sum((metadata->>'size')::bigint), 0) || ' bytes'
from storage.objects group by bucket_id order by bucket_id;

select '== CRON ==';
select jobname || ' :: ' || schedule from cron.job order by jobname;

select '== INTEGRITY ==';
-- Should be 0. A non-zero here after restore means on_auth_user_created fired
-- during the data load and created rows that the dump also inserted.
select 'subscribers_without_auth_user = ' || count(*)
from public.subscribers s where not exists (select 1 from auth.users u where u.id = s.id);
select 'auth_users_without_subscriber = ' || count(*)
from auth.users u where u.email is not null
  and not exists (select 1 from public.subscribers s where s.id = u.id);
select 'orphan_orders = ' || count(*)
from public.orders o where not exists (select 1 from public.subscribers s where s.id = o.subscriber_id);
