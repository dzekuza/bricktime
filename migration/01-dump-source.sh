#!/usr/bin/env bash
# Dumps the SOURCE project. Read-only against source — writes only to ./dump.
#
# Strategy note: we dump the LIVE SCHEMA, not the migration files. The repo's
# supabase/migrations history does not reproduce production (see README
# "Why we dump instead of replaying migrations"), so the live schema is the
# only trustworthy source of truth.
set -euo pipefail
cd "$(dirname "$0")"
source ./_lib.sh

require_env SOURCE_DB_URL >/dev/null || { bad "SOURCE_DB_URL missing"; exit 1; }
mkdir -p "$DUMP_DIR"

hr "DUMPING SOURCE"

# 1. Roles. Only genuinely custom roles — every Supabase-managed role already
#    exists on the target, and re-creating them breaks the platform.
echo "→ roles"
psql "$SOURCE_DB_URL" -X -tA -o "$DUMP_DIR/roles.sql" <<'SQL'
select '-- custom roles (Supabase-managed roles are provisioned by the platform)';
select format('create role %I;', rolname)
from pg_roles
where rolname not like 'pg\_%'
  and rolname not in (
    'postgres','anon','authenticated','service_role','authenticator',
    'dashboard_user','supabase_admin','supabase_auth_admin',
    'supabase_storage_admin','supabase_functions_admin',
    'supabase_read_only_user','supabase_realtime_admin','pgbouncer',
    'supabase_etl_admin','supabase_privileged_role','supabase_replication_admin',
    'cli_login_postgres'
  );
SQL
ok "roles.sql"

# 2. Schema. Only public and cron. auth/storage/realtime structure is
#    provisioned by the platform on the target; restoring ours over theirs
#    corrupts the project.
echo "→ schema (public + cron)"
pg_dump "$SOURCE_DB_URL" \
  --schema-only \
  --no-owner --no-privileges --no-publications --no-subscriptions \
  --schema=public \
  --schema=cron \
  > "$DUMP_DIR/schema.sql"
ok "schema.sql ($(wc -l < "$DUMP_DIR/schema.sql" | tr -d ' ') lines)"

# 3. Data. public rows + auth users.
#    --disable-triggers is ESSENTIAL: without it, restoring auth.users fires
#    on_auth_user_created, which inserts duplicate public.subscribers rows that
#    then collide with the subscribers data in this same dump.
#
#    The storage schema is deliberately EXCLUDED. 03-storage-migrate.ts uploads
#    the real files through the Storage API, and that API creates the matching
#    storage.objects rows itself. Restoring those rows here as well would
#    collide with the uploads and leave rows pointing at bytes that were never
#    copied. Buckets are recreated by the same script from buckets.json.
echo "→ data (public + auth)"
pg_dump "$SOURCE_DB_URL" \
  --data-only --use-copy --disable-triggers \
  --no-owner --no-privileges \
  --schema=public \
  --schema=auth \
  --exclude-table='auth.schema_migrations' \
  --exclude-table='auth.refresh_tokens' \
  --exclude-table='auth.sessions' \
  --exclude-table='auth.mfa_amr_claims' \
  --exclude-table='auth.flow_state' \
  > "$DUMP_DIR/data.sql"
ok "data.sql ($(du -h "$DUMP_DIR/data.sql" | cut -f1))"

# 4. Reference material we re-apply by hand (documented, not auto-restored).
echo "→ reference: cron jobs, bucket config, extensions"
psql "$SOURCE_DB_URL" -X -tA -o "$DUMP_DIR/cron-jobs.txt" <<'SQL'
select format(
  E'-- %s\nselect cron.schedule(%L, %L, $job$%s$job$);',
  jobname, jobname, schedule, command
) from cron.job order by jobid;
SQL

# Emitted as JSON so 03-storage-migrate.ts can recreate buckets exactly.
psql "$SOURCE_DB_URL" -X -tA -o "$DUMP_DIR/buckets.json" <<'SQL'
select coalesce(jsonb_agg(jsonb_build_object(
  'id', id, 'public', public,
  'file_size_limit', file_size_limit,
  'allowed_mime_types', allowed_mime_types
) order by id), '[]'::jsonb) from storage.buckets;
SQL

psql "$SOURCE_DB_URL" -X -tA -o "$DUMP_DIR/extensions.txt" \
  "select extname from pg_extension order by 1;"

psql "$SOURCE_DB_URL" -X -tA -o "$DUMP_DIR/migration-history.txt" \
  "select version || '  ' || coalesce(name,'') from supabase_migrations.schema_migrations order by version;"
ok "reference files"

hr "DUMP COMPLETE"
ls -lh "$DUMP_DIR" | tail -n +2 | awk '{printf "  %-28s %s\n", $9, $5}'
echo
warn "dump/ contains all user data and auth hashes — it is gitignored; delete it after cutover."
ok "Next: review dump/schema.sql, then ./02-restore-target.sh"
