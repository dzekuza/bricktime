# Bricktime → new Supabase account

Migrates project **`brick` / `ohofugyndkaalzsyobvb`** (org GvozdPer, eu-west-1)
to **`yzqaiqgzvlmxnehtqazq`** (eu-west-1).

Scale: 19 MB database · 17 auth users · 63 MB storage across 6 buckets ·
14 edge functions · 1 cron job.

---

## Status: database + storage MIGRATED and verified

`./04-verify.sh` reports **PARITY OK** — 664 checks identical across row counts
(real `count(*)`, all 23 tables), auth users, password-hash fingerprint, schema,
columns, RLS, policies, functions, triggers, views, indexes, constraints,
extensions, storage buckets/objects/policies, cron, and integrity.

Storage: 15 objects / 65,644,984 bytes — byte-identical, files verified serving
over HTTP with correct content-types; private `feed` bucket correctly rejects anon.

Remaining work is the manual cutover in `05-cutover-checklist.md`: edge function
secrets, Stripe webhook, and app/Vercel env vars.

### Gotchas this migration actually hit

1. **`--schema=public` omits objects that live elsewhere.** The `auth.users`
   `on_auth_user_created` trigger and **all 14 `storage.objects` RLS policies**
   were missing after the first restore. `dump/auth-storage-objects.sql`
   regenerates them; the verify script now covers both.
2. **`pg_stat_user_tables.n_live_tup` is an estimate.** It read stale on the
   long-running source and exact on the fresh target, inventing diffs on 9
   tables. Verify now uses real `count(*)`.
3. **`--use-copy` and `--disable-triggers` are wrong here.** The first is a
   `supabase db dump` flag, not `pg_dump`. The second emits superuser-only
   statements and the Supabase `postgres` role is not a superuser — the restore
   uses `session_replication_role = 'replica'` instead.
4. **`products.gallery` is `text[]`, not jsonb** — the URL rewrite needs
   element-wise array rebuild, not a jsonb cast.
5. **The source kept taking writes mid-migration.** Products 18/19/20 were
   deleted on source *after* the dump. Re-synced. **Freeze writes before final
   cutover.**

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

## Completion state

| Step | State |
|---|---|
| Extensions matched on target | done |
| Schema dumped from live source and restored | done |
| Data restored (23 tables, 17 auth users, hashes intact) | done |
| `auth.users` trigger + 14 storage RLS policies restored | done |
| Storage: 6 buckets, 15 objects, 65,644,984 B | done, byte-identical |
| Old-ref URLs rewritten (4 image_url, 3 gallery, 2 feed) | done, 0 remaining |
| Vault secrets recreated with target's own url/key | done |
| Cron `lpexpress-delivery-sync` recreated | done |
| `./04-verify.sh` | **PARITY OK** |
| Edge functions + secrets | **pending — manual** |
| Stripe webhook endpoint + new signing secret | **pending — manual** |
| App / Vercel env vars | **pending — manual** |

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
