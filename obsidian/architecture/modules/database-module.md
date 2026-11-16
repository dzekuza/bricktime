---
tags: [architecture, codebase-map]
updated: 2026-11-16
synced_commit: a985f7f
---

# Database (Supabase Postgres)

### Database — `supabase/migrations/`

Purpose: schema, row-level security, views, RPCs and triggers that enforce rental, budget, billing-column and moderation rules for both apps. 109 migration files; `create policy` appears 150 times across them (policy names not enumerated here, TODO). Domain terms: **subscriber** (a member; row id equals the auth user id), **plan**, **order** (a rental of one product, status `processing`, `active`, `overdue`, `returned`, `return_requested`), **held brick value**, **merch order**, **gift card**, **coupon hold**, **penalty**, **feed item**, **achievement**.

Interface: the browser reaches it through PostgREST under RLS (anon or member JWT); edge functions use the service role. Invariants: members cannot write billing columns (`guard_subscriber_billing_columns`), cannot insert an order that breaks budget, tier, availability, delivery or pause rules (`guard_member_order_insert` which now delegates to `apply_member_rental_rules`, `assert_product_available`), updates to orders are restricted (`guard_member_order_update`); admins are identified by `auth.jwt() -> app_metadata ->> role = 'admin'`.

Depends on: Supabase Auth (`on_auth_user_created` -> `handle_new_auth_user`), extensions `pg_cron`, `pg_net`, Vault.
Used by: all other modules.

<!-- auto:start module=database -->
| Function / export | File:line | Signature (one line) | Does | Called from |
|---|---|---|---|---|
| Tables (29 in `src/lib/database.types.ts`) | `src/lib/database.types.ts:16` | n/a | `achievements`, `challenge_completions`, `challenges`, `coming_soon_subscribers`, `coupon_holds`, `coupons`, `cron_secrets`, `faq_items`, `feed_item_anon_likes`, `feed_items`, `feed_likes`, `gift_cards`, `home_content`, `home_how_it_works_steps`, `home_marquee_items`, `home_testimonials`, `legal_pages`, `merch_items`, `merch_orders`, `missing_part_requests`, `orders`, `page_headers`, `plans`, `product_categories`, `product_reviews`, `products`, `reports`, `subscriber_penalties`, `subscribers`, `user_achievements` | storefront, admin, edge |
| Views | `20260512000001_best_practices_fixes.sql` and later | n/a | `community_feed` (moderation-filtered), `leaderboard` (live view), `product_availability`, `public_stats`, `user_profile_view`, `public_profiles` | storefront, admin |
| `used_credits(subscriber_id)` | `20261105225000_annual_budget_monthly_window.sql` (latest of 4 redefinitions) | `uuid -> numeric` | Budget used in the current monthly window | `useCredits.ts` |
| `held_brick_value(subscriber)` | `20261030140000_pending_plan_change.sql` | `uuid -> numeric` | Value of sets currently held | `_shared/plan-schedule.ts` |
| `begin_subscription_pause(subscriber, until)` | `20261105190551_budget_fallback_and_pause_reentry.sql` | `(uuid, timestamptz)` | Atomic pause start, refuses while sets held | `pause-subscription` |
| `apply_member_rental_rules(order, is_courier_paid)` | `20261115120000_paid_courier_rentals.sql` | `(public.orders, boolean) -> public.orders` | Single home of the member rental rules (active, not paused, cancel_at not within 14 days, tier, budget via `used_credits` under an advisory lock, door delivery needs `home_delivery`, plan `mega` or a paid fee, name/phone/address present) and fills server-owned columns; extracted from `guard_member_order_insert` | `guard_member_order_insert`, `record_paid_courier_rental` |
| `record_paid_courier_rental(subscriber, product, stripe_session_id, amount, dry_run)` | `20261115120000_paid_courier_rentals.sql` | `(uuid, integer, text, numeric, boolean default false) -> uuid`, `security definer`, execute granted to `service_role` only | Creates the courier-delivered rental a member paid for; idempotent on `orders.stripe_session_id`; `p_dry_run` checks the rules and `product_availability` without writing | `stripe-webhook`, `create-rental-courier-checkout` |
| `record_merch_order(...)` | `20261109120000_merch_delivery_method.sql` (latest of 4) | RPC | Idempotent order insert with stock guard (flags `stock_short`) | `stripe-webhook` |
| `get_merch_order_by_session(session_id)` | `20261105220000_merch_checkout_hardening.sql` | `text -> row` | Order lookup; hides buyer PII for guest orders older than 1 h | `MerchThankYou.tsx` |
| `claim_coupon_hold(code, minutes, user_id)` | `20261105220200_coupon_holds_per_user.sql` | RPC | Per-user coupon hold | `create-merch-checkout` |
| `redeem_coupon(...)` | not in local migrations (TODO: unknown definition) | RPC | Counts a coupon use; not idempotent | `stripe-webhook`, `change-subscription` |
| `toggle_like(feed_item, subscriber)`, `toggle_like_anon(feed_item, session)` | `20260923130000_harden_rpc_functions.sql`, `20260822000000_anonymous_likes.sql` | RPC | Likes | `Community.tsx` |
| `evaluate_achievements(subscriber)`, `refresh_my_achievements()` | `20260921120000_daily_checkin_points.sql`, `20260826235922_refresh_achievements_rpc.sql` | RPC | Achievement evaluation | triggers, `useDailyCheckin` |
| `auth_email_confirmed()` | `20261030130000_gift_cards_require_confirmed_email.sql` | `-> bool` | RLS helper | policies on `gift_cards` |
| Triggers | various | n/a | `subscribers_guard_billing_columns`, `orders_guard_member_insert`, `orders_guard_member_update`, `orders_assert_product_available`, `orders_set_returned_at`, `feed_items_enforce_checkin`, `feed_items_set_status`, `feed_items_evaluate_achievements`, `feed_likes_evaluate_achievements`, `on_auth_user_created`, `*_updated_at` via `touch_updated_at()` | n/a |
| Cron | `20260707192807_lpexpress_delivery_activation.sql` | `*/30 * * * *` | `lpexpress-delivery-sync` -> `lpexpress-sync` | pg_cron |
| Storage buckets | `20260907140000_site_content_media_storage_policies.sql`, client use | n/a | `site-content`, `site-media`, `products`, `community-images` (the last two are referenced by client code; creation not found in migrations) | admin uploads, Community |
<!-- auto:end -->

Counts: 29 tables (`orders` gained unique `stripe_session_id`), 6 views, about 22 functions, about 12 triggers, 1 migration-defined cron job.

Notes (hand-written, flagged as drift): `coupons`, `subscriber_penalties`, `public_profiles` and `redeem_coupon` are used by code and present in generated types but **have no CREATE in `supabase/migrations/`**; per `meta/status.md` some migrations (#97's `20261105220000` to `220400`) were applied by hand in the SQL editor and are not in `schema_migrations`. Several functions were redefined 3 to 4 times (`used_credits`, `guard_member_order_insert`, `record_merch_order`); only the last file is live truth. The `process-plan-changes` cron schedule is also absent. Enum `plan_tier` is `nano, mini, standard, pro, mega, mystery_s, mystery_m` (generated types); `pro` is retired in data but still an enum value. Order status enum also has `return_requested` and `return_declined` (migration `20260707182808`). See [[database]] for the hand-written schema notes.
