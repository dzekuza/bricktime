#!/usr/bin/env bash
# Verifies tooling and connectivity before anything is dumped or written.
# Safe to run repeatedly; makes no changes.
set -euo pipefail
cd "$(dirname "$0")"
source ./_lib.sh

hr "PRE-FLIGHT"

# --- tooling -----------------------------------------------------------------
fail=0

if have pg_dump; then
  pgdump_major="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
  if [ "$pgdump_major" -ge 17 ]; then
    ok "pg_dump $pgdump_major (>= 17, matches server)"
  else
    bad "pg_dump is $pgdump_major but the server runs Postgres 17."
    echo "     A dump taken with an older client will be rejected on restore."
    echo "     Fix: brew install postgresql@17 && brew link --force postgresql@17"
    fail=1
  fi
else
  bad "pg_dump not found."
  echo "     Fix: brew install postgresql@17 && brew link --force postgresql@17"
  fail=1
fi

have psql       && ok "psql present"       || { bad "psql not found (same fix as above)"; fail=1; }
have supabase   && ok "supabase CLI $(supabase --version 2>/dev/null | head -1)" || warn "supabase CLI not found (only needed for edge function deploys)"
have node       && ok "node $(node --version)" || { bad "node not found (needed for storage copy)"; fail=1; }

# --- env ---------------------------------------------------------------------
hr "ENVIRONMENT"
require_env SOURCE_DB_URL SOURCE_URL SOURCE_SERVICE_ROLE_KEY \
            TARGET_DB_URL TARGET_URL TARGET_SERVICE_ROLE_KEY || fail=1

# --- connectivity ------------------------------------------------------------
hr "CONNECTIVITY"
if psql "$SOURCE_DB_URL" -tAc "select 1" >/dev/null 2>&1; then
  ok "source database reachable ($(psql "$SOURCE_DB_URL" -tAc "select current_database()"))"
else
  bad "cannot connect to SOURCE_DB_URL"
  echo "     If this hangs, you are probably on the direct (IPv6-only) host."
  echo "     Use the Session Pooler string from Settings > Database instead."
  fail=1
fi

if psql "$TARGET_DB_URL" -tAc "select 1" >/dev/null 2>&1; then
  ok "target database reachable"
  tgt_tables=$(psql "$TARGET_DB_URL" -tAc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'")
  tgt_users=$(psql "$TARGET_DB_URL" -tAc "select count(*) from auth.users")
  if [ "$tgt_tables" != "0" ] || [ "$tgt_users" != "0" ]; then
    warn "target is NOT empty: $tgt_tables public tables, $tgt_users auth users."
    echo "     02-restore-target.sh refuses to run against a non-empty target"
    echo "     unless you pass --force. Reset it in the dashboard first."
  else
    ok "target is empty and ready"
  fi
else
  bad "cannot connect to TARGET_DB_URL"
  fail=1
fi

# --- source inventory snapshot ----------------------------------------------
hr "SOURCE INVENTORY"
psql "$SOURCE_DB_URL" -X -q -f ./04-verify.sql 2>/dev/null || warn "inventory query failed (non-fatal)"

hr
if [ "$fail" -ne 0 ]; then
  bad "pre-flight FAILED — fix the items above before continuing."
  exit 1
fi
ok "pre-flight passed. Next: ./01-dump-source.sh"
