# Rollbacks

Down-migrations for forward migrations whose rollback is too long to sit as a
comment block inside the migration file itself.

**These are never applied automatically.** They live outside
`supabase/migrations/` on purpose — anything with a `.sql` extension in that
directory is executed by `supabase db push`, so a rollback stored there would
undo its own migration on the next deploy.

Run one deliberately, against a specific project:

```bash
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/rollbacks/<version>_<name>.down.sql
```

Then remove the version from the history table so the forward migration can be
re-applied:

```sql
delete from supabase_migrations.schema_migrations where version = '<version>';
```

Short rollbacks stay as a commented `-- Down migration (manual rollback):`
block at the foot of the migration itself, matching
`20260821161829_home_content_promo_video.sql`.
