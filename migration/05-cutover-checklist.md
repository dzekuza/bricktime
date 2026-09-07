# Cutover checklist

Everything here is **manual** — it cannot be dumped or scripted, because the
values are either write-only in Supabase (vault, function secrets) or live
outside the database entirely (Vercel, Stripe, Google).

Source `ohofugyndkaalzsyobvb` ("brick") → Target `yzqaiqgzvlmxnehtqazq`.

---

## 1. Edge function secrets

All 14 functions must be redeployed to the target, and these secrets re-set on
it. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
injected by the platform — do **not** set them manually.

Set on the target project (Dashboard → Edge Functions → Secrets, or
`supabase secrets set --project-ref yzqaiqgzvlmxnehtqazq`):

| Secret | Used by |
|---|---|
| `STRIPE_SECRET_KEY` | create-checkout, create-billing-portal, create-gift-card-checkout, create-merch-checkout, create-penalty-checkout, delete-account, get-billing-history, stripe-webhook |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook — **must be regenerated**, see §3 |
| `OMNISEND_API_KEY` | omnisend-subscribe, stripe-webhook |
| `GA4_PROPERTY_ID` | get-analytics |
| `GSC_SITE_URL` | get-analytics |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | get-analytics |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | get-analytics |
| `LP_API_BASE` | lpexpress, lpexpress-sync |
| `LP_SENDER_COUNTRY` | lpexpress |
| `LP_SENDER_EMAIL` | lpexpress |
| `LP_SENDER_FLAT` | lpexpress |
| `LP_SENDER_PHONE` | lpexpress |

> The LP_* and GOOGLE_* values are **not** in any local `.env` file — they exist
> only in the source project's function secrets, which are write-only. Read them
> from the source dashboard before decommissioning it. Losing them breaks
> shipping (LP Express) and the admin Analytics page.

Deploy:
```bash
supabase link --project-ref yzqaiqgzvlmxnehtqazq
supabase functions deploy --project-ref yzqaiqgzvlmxnehtqazq
```
> Note: the Supabase CLI on this machine is currently authenticated to a
> different account that can see neither project. `supabase login` with the new
> account first.

---

## 2. Vault secrets (2 on source)

`vault.secrets` values are encrypted with a **project-specific key** and cannot
be dumped or decrypted off-project. Read the two names from the source
dashboard (Settings → Vault), then recreate them on the target with the same
names. The `lpexpress-delivery-sync` cron job reads them.

---

## 3. Stripe

- [ ] Repoint the webhook endpoint to
      `https://yzqaiqgzvlmxnehtqazq.supabase.co/functions/v1/stripe-webhook`
- [ ] Stripe issues a **new signing secret** for the new endpoint — copy it into
      `STRIPE_WEBHOOK_SECRET` on the target. Reusing the old one fails every
      webhook with a signature error.
- [ ] Keep the old endpoint enabled until the new one is confirmed receiving, so
      no events are dropped mid-cutover.
- [ ] Verify `customer.subscription.*` and `checkout.session.completed` land.

---

## 4. Cron job

One job on source: `lpexpress-delivery-sync`, `*/30 * * * *`.
Recreate after restore using `dump/cron-jobs.txt`, then confirm:
```sql
select jobname, schedule, active from cron.job;
select * from cron.job_run_details order by start_time desc limit 5;
```

---

## 5. Application env vars

**Do not edit `.env.local` files directly** — per the repo convention, these
values get handed over and applied by hand.

Values to change in `.env.local`, `admin/.env.local`, and in **Vercel** (both
the storefront and admin projects, all environments):

| Var | New value |
|---|---|
| `VITE_SUPABASE_URL` | `https://yzqaiqgzvlmxnehtqazq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | target anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | target service-role key (server only) |
| `DATABASE_URL` | target pooler URL |

Unchanged: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_GA_MEASUREMENT_ID`,
`VITE_SITE_ACCESS_CODE`, `OMNISEND_API_KEY`.

> `admin/.env.local` on the old project carried a `VITE_SUPABASE_SERVICE_ROLE_KEY`.
> A `VITE_`-prefixed var is bundled into client JS, so that key was shipped to
> browsers. **Do not recreate it on the new project** — and rotate it on the old
> one. The admin app should reach privileged operations through edge functions.

---

## 6. Post-cutover

- [ ] `./04-verify.sh` reports PARITY OK
- [ ] Regenerate types into **both** locations (they are separate apps):
      `supabase gen types typescript --project-id yzqaiqgzvlmxnehtqazq > src/lib/database.types.ts`
      and the same into `admin/src/lib/database.types.ts`
- [ ] Update `supabase/.temp/linked-project.json` by re-running `supabase link`
- [ ] Sign in as a real user — proves password hashes survived
- [ ] Load a product image from each public bucket
- [ ] Complete one test checkout end to end
- [ ] Confirm the storefront's Storage URLs resolve (they embed the project ref;
      any hardcoded `ohofugyndkaalzsyobvb` URL in the DB or code must be rewritten
      — see `06-rewrite-storage-urls.sql`)
- [ ] Only after all of the above: pause the old project, and keep it for 30 days
      before deleting

---

## 7. Known issues carried over

These exist on source today and will migrate as-is. Fix on the new project:

- `product_availability` and `leaderboard` views are `SECURITY DEFINER` (advisor ERROR)
- `handle_new_auth_user()` and `redeem_coupon()` are executable by the `anon` role
- `redeem_coupon`, `set_feed_item_status`, `enforce_checkin_once_per_day` have mutable `search_path`
- Leaked-password protection is disabled in Auth settings
- 1 auth user has no matching `public.subscribers` row (17 users vs 16 subscribers)
