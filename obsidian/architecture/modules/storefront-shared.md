---
tags: [architecture, codebase-map]
updated: 2026-11-16
synced_commit: a985f7f
---

# Storefront shared: components, contexts, hooks, lib, data

### Storefront shared code — `src/components/`, `src/contexts/`, `src/hooks/`, `src/lib/`, `src/data/`

Purpose: reusable UI, session and plan state, data hooks and clients that the pages assemble. Domain terms: **brick** (credit unit shown as "briksai"), **plan** (table `plans`, UI "subscription"), **terminal**, **check-in**, **achievement**.

Interface: components are props-driven React; contexts are mounted in `src/main.tsx` and read through `useAuth`, `useSubscriptions`, `useConsentContext`, `useBreadcrumbLabel`; hooks return plain state objects; `lib/` exports pure helpers and clients (`supabase`, LP Express wrappers). Invariants: no hardcoded colors (brand tokens, see [[design-system]]); billing columns are never written from the browser (`guard_subscriber_billing_columns`), so UI waits on `waitForSubscriberBilling`.

Depends on: [[database-module]], [[fulfilment-edge]] (`lib/lpexpress.ts` -> `lpexpress`), [[billing-edge]], external: Supabase, Google Analytics and Meta Pixel (after consent).
Used by: [[storefront-pages]].

<!-- auto:start module=storefront-shared -->
| Function / export | File:line | Signature (one line) | Does | Called from |
|---|---|---|---|---|
| `AuthProvider`, `useAuthContext` | `src/contexts/AuthContext.tsx:23,91` | provider, `() => AuthContextValue` | Session user + `subscribers` profile (`id,name,avatar,plan,status,cancel_at`), `signOut`, `refreshProfile` | `main.tsx`; `useAuth` |
| `useAuth` | `src/hooks/useAuth.ts:13` | `() => AuthContextValue` | One-line alias of `useAuthContext` | Community, Checkout, Account, MerchDrop, Subscribe, Nav, useCredits, useDailyCheckin, Subscriptions |
| `SubscriptionsProvider`, `useSubscriptionsContext` | `src/contexts/SubscriptionsContext.tsx:13,43` | provider, hook | Loads active `plans` ordered by `sort_order` once | `main.tsx`; `useSubscriptions` |
| `useSubscriptions` | `src/hooks/useSubscriptions.ts:24` | `() => {subscriptions, loading, error}` | Alias of context; exports `DbSubscription` type | Checkout, Account, Subscribe, Nav, Subscriptions, useCredits |
| `ConsentProvider`, `useConsentContext` | `src/contexts/ConsentContext.tsx:36,74` | provider, hook | Cookie consent; loads GA / Meta Pixel after consent | `main.tsx`, `App.tsx`, `CookieConsentBanner` |
| `BreadcrumbProvider`, `useBreadcrumbLabel` | `src/contexts/BreadcrumbContext.tsx:10,19` | provider, hook | Lets a page set the breadcrumb label | Drop, MerchDrop, MerchThankYou |
| `useCredits` | `src/hooks/useCredits.ts:76` | `() => CreditsState` | Budget: `plans.credits`, `rpc used_credits`, remaining, over-budget, when budget frees (`resolveBudgetFreesAt`) | Checkout, Account, Nav |
| `usePaidCourierReturn` | `src/hooks/usePaidCourierReturn.ts:13` | `(userId, sessionId) => "idle" \| "waiting" \| "placed" \| "missing"` | After the courier-fee Checkout, polls `orders` by `subscriber_id` + `stripe_session_id` (20 attempts, 1.5 s) until the webhook has created the rental; `missing` means not created in time or refused and refunded | `Checkout.tsx` |
| `useDiscountCode` | `src/hooks/useDiscountCode.ts:16` | `() => {...}` / `AppliedCode` | Resolves coupon (`coupons` table) or gift card (`verify-gift-card`) client-side for preview | Account, DiscountCodeField, PlanChangeSummary |
| `useDailyCheckin` | `src/hooks/useDailyCheckin.ts:38` | `() => DailyCheckin` | Inserts today's check-in feed item, `rpc refresh_my_achievements` | `App.tsx`, Community, DailyCheckinBanner |
| `useAchievements` | `src/hooks/useAchievements.ts:5` | `() => ...` | Loads `achievements` | Community, Account, UserProfile |
| `useProductAvailability` | `src/hooks/useProductAvailability.ts:9` | `() => ...` | Reads view `product_availability` | Checkout, Drop, Archive, FeaturedProducts |
| `useCategories` | `src/hooks/useCategories.ts:12` | `() => string[]` | Reads `product_categories` | Archive, FeaturedProducts |
| `usePublicStats` | `src/hooks/usePublicStats.ts:14` | `() => PublicStats \| null` | Reads view `public_stats` | Hero, FAQ |
| `useLegalPage` | `src/hooks/useLegalPage.ts:20` | `(slug) => ...` | Reads `legal_pages` | StoreRules, PrivacyPolicy |
| `usePageHeaderImage` | `src/hooks/usePageHeaderImage.ts:7` | `(slug) => ...` | Reads `page_headers` | Merch, GiftCards, Archive |
| `useSiteAccess` | `src/hooks/useSiteAccess.ts:14` | `() => {granted, unlock}` | Pre-launch gate using `VITE_SITE_ACCESS_CODE` in localStorage | `ComingSoonGate` |
| `useReveal` | `src/hooks/useReveal.ts:3` | `<T>() => ref` | GSAP scroll reveal | About, Community, Subscribe, HowItWorks, FAQ, others |
| `supabase` | `src/lib/supabase.ts:7` | `SupabaseClient<Database>` | The only browser data client | everywhere |
| `waitForSubscriberBilling` | `src/lib/wait-for-subscriber.ts:19` | `(userId, isConfirmed, signal?) => Promise<SubscriberBilling \| null>` | Polls own `subscribers` row after Stripe redirect | Checkout, Account, Subscribe |
| `readFunctionError` | `src/lib/function-error.ts:6` | `(error, fallback) => Promise<string>` | Unwraps edge function error body | Checkout, Account, MerchDrop, Subscribe |
| `translateAuthError` | `src/lib/auth-errors.ts:18` | `(message) => string` | Lithuanian auth errors | AuthForm, ResetPassword |
| `fetchTerminals`, `fetchTracking`, `createLabel`, `createReturnLabel`, `fetchLabelPdf`, `downloadPdf` | `src/lib/lpexpress.ts:39,53,66,86,97,110` | typed wrappers | Call edge function `lpexpress` with one cold-start retry | TerminalPicker, OrderTracking, ReturnDialog, Checkout, Account, MerchDrop |
| `downloadGiftCardPdf` | `src/lib/gift-card-pdf.ts:55` | `async ({...}) => void` | Renders a gift card with jsPDF | GiftCards |
| `loadGoogleAnalytics`, `loadMetaPixel`, `trackPageview`, `trackEvent` | `src/lib/analytics.ts:23,40,63,68` | functions | Consent-gated analytics; `trackEvent` has no caller outside the file | ConsentContext, App |
| `getAnonSessionId`, `getAnonLikedIds`, `toggleAnonLikedId` | `src/lib/anonSession.ts:4,13,22` | functions | Anonymous like state in localStorage | Community |
| `getSubscriptionDisplayName`, `getSubscriptionBrickImage`, `getSubscriptionTheme`, `getSubscriptionBrickSvg` | `src/lib/subscription-branding.ts:116,121,126,131` | `(plan) => ...` | Plan key to display name, art and theme (hardcoded map) | Drop, Community, Checkout, UserProfile, ProductCard, NextDrop, HowItWorks |
| `getDisplayPlan`, `sortPlans`, `SUBSCRIPTION_CHIPS`, `AGE_CHIPS` | `src/lib/product-filters.ts:29,39,1,10` | helpers | Archive filter chips and plan labelling | Drop, Checkout, ProductCard, Archive |
| `parseHeadingMarkup` | `src/lib/heading-markup.ts:10` | `(markup) => HeadingLine[]` | Admin-authored heading markup to segments | `HeadingMarkup.tsx` |
| `getVilniusParts`, `formatReleaseMonth`, `formatReleaseMonthFirst` | `src/lib/vilnius-time.ts:38,52,59` | helpers | Europe/Vilnius date math | ProductCard |
| `dbToProduct` | `src/components/ProductCard.tsx:91` | `(row) => Product` | DB row to display model | Drop, Archive, FeaturedProducts |
| Layout and brand components | `src/components/Nav.tsx:164`, `Footer.tsx:27`, `Hero.tsx:83`, `Marquee.tsx:16`, `HowItWorks.tsx:77`, `Subscriptions.tsx:72`, `FAQ.tsx:73`, `Testimonials.tsx:72`, `BigCTA.tsx:7`, `NextDrop.tsx:48`, `FeaturedProducts.tsx:72`, `FloatingVideoWidget.tsx:6`, `LoadingScreen.tsx:4`, `LegoWalker.tsx:1`, `Seo.tsx:28`, `Breadcrumb.tsx:61` | JSX | Home and chrome | Home and pages |
| Commerce components | `ProductCard.tsx:202`, `PlanFitConfigurator.tsx:38`, `TerminalPicker.tsx:10`, `OrderTracking.tsx:23`, `ReturnDialog.tsx:20`, `MissingPartDialog.tsx:36`, `checkout/PlanChangeConfirm.tsx:27`, `checkout/UpgradePriceNotes.tsx:19`, `merch/MerchDelivery.tsx:24`, `merch/MerchDiscountCode.tsx:23` | JSX | Rental, delivery and plan-change widgets | Checkout, Account, MerchDrop, Drop |
| Account components | `account/PlanChangeSummary.tsx:53`, `PauseSubscription.tsx:30`, `PaymentHistory.tsx:100`, `RentalHistory.tsx:73`, `RentedOrderCard.tsx:53`, `GiftCardTile.tsx:43`, `DiscountCodeField.tsx:19`, `SubscriptionNotices.tsx:42`, `account/order-status.ts` | JSX | Account page pieces | Account |
| Community, reviews, auth components | `community/DailyCheckinBanner.tsx:3`, `community/StatusBadge.tsx:13`, `reviews/ProductReviews.tsx:23`, `ReviewForm.tsx:12`, `StarRating.tsx:12`, `AuthForm.tsx:6`, `ProfileEditDialog.tsx:67`, `DeleteAccountDialog.tsx:18`, `TermsAgreement.tsx:11`, `CookieConsentBanner.tsx:4`, `ComingSoonGate.tsx:5`, `coming-soon/WaitlistForm.tsx:5` | JSX | Social, identity, gate | pages |
<!-- auto:end -->

Counts: 4 contexts (8 exports), 13 hooks, about 40 lib functions, about 75 components (13 shadcn primitives in `components/ui/` not listed).

Notes (hand-written): `data/community.ts` (about 360 lines) still holds mock `feedItems`, `leaderboard`, `currentUserAchievements` that nothing outside `src/data/` imports; only `calculatePoints` and `getRelativeTime` are used. `data/merch.ts` has no importer. `useAuth` and `useSubscriptions` are one-line aliases over their contexts. `components/Nav.tsx` is high-churn (11 commits in 90 days).
