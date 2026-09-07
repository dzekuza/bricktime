# Bricktime → new Supabase account

Migrates project **`brick` / `ohofugyndkaalzsyobvb`** (org GvozdPer, eu-west-1)
to **`yzqaiqgzvlmxnehtqazq`** (eu-west-1).

Scale: 19 MB database · 17 auth users · 63 MB storage across 6 buckets ·
14 edge functions · 1 cron job.

---

## ⛔ Two blockers, both need action on the Supabase dashboard

### 1. The source project's API is suspended (HTTP 402)

```
Service for this project is restricted due to the following violations:
exceed_cached_egress_quota. The project owner must upgrade their plan or
remove spend caps to restore service.
```

This affects **Storage, REST and Auth** on the source — verified by direct
request. The live site's data layer is down because of it, and the 63 MB of
storage files cannot be read until it is lifted, because every download path
goes through that API.

**Action:** in the source project's dashboard, remove the spend cap or upgrade
the plan. Only then can `03-storage-migrate.ts` run.

The direct Postgres port is *not* restricted, which is why the database half of
the migration can proceed independently.

### 2. `SOURCE_DB_URL` password is missing

`.env.migration` has every credential except the source database password.
Get it from the source dashboard (Settings → Database → Connection string, or
reset the password there) and fill in `SOURCE_DB_URL` using the **Session
Pooler** string, not the direct host.

---

## Why we dump instead of replaying migrations

`supabase/migrations/` **cannot** rebuild this database. Verified, not assumed:

- Replaying from scratch fails at migration 5 of 58 —
  `20260518000001_expand_plans_table.sql` hits
  `duplicate key value violates unique constraint "plans_level_key"` because
  `20260430000002_seed_data.sql` already inserted those rows.
- `seed_data.sql` also inserts **10 fake `@example.com` auth users**. A replay-based
  migration would have shipped those into the new production database.
- The recorded history does not match the files either. Four files
  (`20260827001500`, `20260827002000`, `20260903000000`, `20260903010000`) are
  absent from `supabase_migrations.schema_migrations`, yet their effects — the
  `on_auth_user_created` trigger, `merch_items.image_urls`, and all four
  `merch_admin_*` policies — are live. They were applied outside the CLI.
- Two versions applied in prod (`20260903144522`, `20260903145533`) have no
  local file at all. Their SQL, recovered from the `statements` column, is
  identical to two of the four files above — the same change applied twice under
  different timestamps.

So the live schema is the only source of truth. `01-dump-source.sh` dumps it
directly, and `04-verify.sh` proves the target matches.

---

## Order of operations

```bash
cd migration
cp .env.migration.example .env.migration   # already generated; fill SOURCE_DB_URL
export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"

./00-preflight.sh                    # tooling + connectivity, changes nothing
./01-dump-source.sh                  # reads source, writes ./dump
./02-restore-target.sh               # WRITES to target
node --env-file=.env.migration 03-storage-migrate.ts --dry-run
node --env-file=.env.migration 03-storage-migrate.ts
psql "$TARGET_DB_URL" -X -f 06-rewrite-storage-urls.sql
./04-verify.sh                       # must print PARITY OK
```

Then work through **`05-cutover-checklist.md`** — edge function secrets, vault,
Stripe webhook, cron, and the app/Vercel env vars. Those cannot be scripted.

---

## Status

| Step | State |
|---|---|
| Target reachable, PG 17.6, empty | done |
| Extensions matched on target (`pg_cron`, `pg_net`, + defaults) | done |
| Bucket config captured (`dump/buckets.json`) | done |
| Hardcoded storage host removed from `src/lib/media.ts` | done |
| 6 DB rows with old-ref URLs identified, rewrite script ready | done |
| Schema + data dump | **blocked — needs `SOURCE_DB_URL`** |
| Storage file copy | **blocked — source API returns 402** |
| Edge functions, secrets, Stripe, env | pending cutover |

`dump/` and `.env.migration` hold live credentials and user data. Both are
gitignored. Delete them once cutover is verified.

## Notes

- `pg_dump` 18.4 (Homebrew) is on this machine but not on `PATH`; the export
  line above fixes that. A newer client dumping a PG 17 server is supported.
- The Supabase CLI here is logged into a **third account** that can see neither
  the source nor the target project. Run `supabase login` with the new account
  before deploying edge functions.
- Restores run with `session_replication_role = replica` so
  `on_auth_user_created` does not fire while `auth.users` loads and duplicate
  the `subscribers` rows that arrive in the same dump.
