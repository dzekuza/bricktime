#!/usr/bin/env bash
# Restores ./dump into the TARGET project. This WRITES to the target.
# Refuses to run against a non-empty target unless --force is passed.
set -euo pipefail
cd "$(dirname "$0")"
source ./_lib.sh

require_env TARGET_DB_URL >/dev/null || { bad "TARGET_DB_URL missing"; exit 1; }
[ -f "$DUMP_DIR/schema.sql" ] || { bad "no dump found — run ./01-dump-source.sh first"; exit 1; }

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

hr "TARGET SAFETY CHECK"
tgt_tables=$(psql "$TARGET_DB_URL" -tAc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'")
tgt_users=$(psql "$TARGET_DB_URL" -tAc "select count(*) from auth.users")
echo "  target currently has $tgt_tables public tables, $tgt_users auth users"

if { [ "$tgt_tables" != "0" ] || [ "$tgt_users" != "0" ]; } && [ "$FORCE" -ne 1 ]; then
  bad "target is not empty. Reset it in the dashboard, or re-run with --force."
  exit 1
fi

confirm "About to WRITE the full schema and data into the TARGET project.
Target: ${TARGET_REF:-<unset>}
This overwrites whatever is there."

# 1. Reset the public schema. The dump issues its own CREATE SCHEMA public, and
#    dropping it here also clears pg_net (which lives in public) so the
#    extension pass below can recreate it cleanly.
hr "RESET PUBLIC SCHEMA"
psql "$TARGET_DB_URL" -X -q -c "drop schema if exists public cascade;"
ok "public schema dropped"

# 2. Custom roles.
hr "ROLES"
if [ -s "$DUMP_DIR/roles.sql" ]; then
  psql "$TARGET_DB_URL" -X -q -v ON_ERROR_STOP=0 -f "$DUMP_DIR/roles.sql" && ok "roles applied"
fi

# 3. Schema.
hr "SCHEMA"
psql "$TARGET_DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$DUMP_DIR/schema.sql"
ok "schema restored"

# Extensions go in after the schema, because pg_net installs into public and
# public only exists again once the dump has recreated it.
hr "EXTENSIONS"
while read -r ext; do
  [ -z "$ext" ] && continue
  case "$ext" in plpgsql) continue;; esac
  psql "$TARGET_DB_URL" -X -q -c "create extension if not exists \"$ext\";" >/dev/null 2>&1 \
    && ok "$ext" || warn "$ext could not be created (may need dashboard toggle)"
done < "$DUMP_DIR/extensions.txt"

# 4. Data. session_replication_role=replica suppresses triggers AND FK checks
#    for the load, so rows can arrive in any order and on_auth_user_created
#    does not fire and duplicate subscribers rows.
hr "DATA"
psql "$TARGET_DB_URL" -X -q -v ON_ERROR_STOP=1 \
  -c "set session_replication_role = 'replica';" \
  -f "$DUMP_DIR/data.sql" \
  -c "set session_replication_role = 'origin';"
ok "data restored"

# 5. Re-assert grants the platform expects on public.
hr "GRANTS"
psql "$TARGET_DB_URL" -X -q <<'SQL'
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
SQL
ok "grants applied"

hr "RESTORE COMPLETE"
warn "Storage FILES are not migrated yet — run ./03-storage-migrate.ts"
warn "Cron jobs, vault secrets and edge function secrets are manual — see 05-cutover-checklist.md"
ok "Next: ./03-storage-migrate.ts, then ./04-verify.sh"
