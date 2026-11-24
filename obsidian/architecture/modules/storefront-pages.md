---
tags: [architecture, codebase-map]
updated: 2026-11-16
synced_commit: a985f7f
---

# Storefront pages

### Storefront pages — `src/pages/`

Purpose: one default-exported React component per route; each page fetches its own Supabase data and calls edge functions. Domain terms: **drop** (a product detail page `/drop/:id`, "drop" = a set), **archive** (the catalog), **brick budget** (credits), **terminal** vs **courier** delivery, **check-in** and **points** (community gamification).

Interface: a route path in `src/App.tsx:59-82`. Pages take no props and read everything from URL params, contexts ([[storefront-shared]]) and Supabase. Invariants: copy is Lithuanian; the whole tree sits inside `ComingSoonGate`; `/checkout` and `/account` expect a signed-in member and redirect or prompt otherwise (TODO: verify per page).

Depends on: [[storefront-shared]], [[billing-edge]] and [[fulfilment-edge]] (via `supabase.functions.invoke`), [[database-module]], external: Stripe (redirect), Supabase.
Used by: `src/App.tsx` only.

<!-- auto:start module=storefront-pages -->
| Function / export | File:line | Signature (one line) | Does | Called from |
|---|---|---|---|---|
| `Home` (route `/`) | `src/pages/Home.tsx:18` | `() => JSX` | Landing: Seo, Nav, Hero, Marquee, NextDrop, FeaturedProducts, HowItWorks, Subscriptions, FAQ, Footer, FloatingVideoWidget (lazy parts under Suspense) | route |
| `Archive` (`/archive`) | `src/pages/Archive.tsx:32` | `() => JSX` | Catalog with filters, sort, tier gating | route |
| `Drop` (`/drop/:id`) | `src/pages/Drop.tsx:155` | `() => JSX` | Product detail, availability, reviews, related carousel (`RelatedCarousel:80`) | route |
| `Subscribe` (`/subscribe`) | `src/pages/Subscribe.tsx:27` | `() => JSX` | Plan choice for new members; invokes `create-checkout`, `verify-gift-card` | route |
| `Checkout` (`/checkout`) | `src/pages/Checkout.tsx:148` | `() => JSX` (2145 lines) | Rental claim (client insert into `orders` when no fee is due; when `isCourierFeeDue`, i.e. courier picked and not in plan, redirects to `create-rental-courier-checkout` and on return `?courier_paid=true&session_id=` shows the order via `usePaidCourierReturn`; `toRentalErrorMessage`, line 132, maps rule errors to Lithuanian copy), plan swap via `change-subscription`, gift card purchase, billing portal, terminal picking | route |
| `Account` (`/account`) | `src/pages/Account.tsx:244` | `() => JSX` (1816 lines) | Subscription state, rentals, return, pause, cancel, penalties, payment history, profile, achievements (`AchievementsSection:121`) | route |
| `ResetPassword` (`/nustatyti-slaptazodi`) | `src/pages/ResetPassword.tsx:10` | `() => JSX` | Password reset | route |
| `Community` (`/community`) | `src/pages/Community.tsx:1380` | `() => JSX` (1460 lines) | Feed, compose, likes (`toggle_like`, `toggle_like_anon`), challenges, leaderboard; internal `FeedCard:122`, `ComposeBox:467`, `FeedPanel:716`, `ChallengesPanel:1007`, `LeaderboardPanel:1129`, `LeaderboardPodium:1277`, `computeOwnProgress:964` | route |
| `UserProfile` (`/profile/:userId`) | `src/pages/UserProfile.tsx:51` | `() => JSX` | Public profile from `user_profile_view` | route |
| `MerchPage` (`/merch`) | `src/pages/Merch.tsx:183` | `() => JSX` | Merch listing | route |
| `MerchDrop` (`/merch/:slug`) | `src/pages/MerchDrop.tsx:31` | `() => JSX` | Merch detail, size, delivery, code; invokes `create-merch-checkout` | route |
| `MerchThankYou` (`/merch/aciu`) | `src/pages/MerchThankYou.tsx:39` | `() => JSX` | Order confirmation via `rpc get_merch_order_by_session` | route |
| `GiftCards` (`/gift-cards`) | `src/pages/GiftCards.tsx:99` | `() => JSX` | Gift card purchase page | route |
| `FAQPage`, `PausePage`, `ShippingPage`, `ReturnsPage` (`/duk`, `/praleisti-pristabdyti`, `/pristatymas`, `/grazinimai`) | `src/pages/HelpPages.tsx:144,189,230,280` | `() => JSX` | Help content (FAQ from `faq_items`) | route |
| `About`, `Contacts`, `PrivacyPolicy`, `StoreRules`, `NotFound` (`/apie`, `/kontaktai`, `/privatumo-politika`, `/parduotuves-taisykles`, `*`) | `src/pages/About.tsx:35`, `Contacts.tsx:36`, `PrivacyPolicy.tsx:14`, `StoreRules.tsx:14`, `NotFound.tsx:7` | `() => JSX` | Static and legal pages (legal text from `legal_pages` via `useLegalPage`) | route |
| `ComingSoon` | `src/pages/ComingSoon.tsx:62` | `({onUnlock}) => JSX` | Pre-launch gate page with waitlist | `ComingSoonGate` |
<!-- auto:end -->

Counts: 22 routed page components (HelpPages exports 4) plus 1 gate page; about 12 internal sub-components in Community and Account.

Hot spots (hand-written): `Account.tsx` (57 commits touching in the last 90 days), `Checkout.tsx` (34), `Drop.tsx` (28), `Community.tsx` (16). Each is a large single file with 28 to 36 `useState` calls and direct Supabase and edge-function calls; see [[deepening-candidates]].
