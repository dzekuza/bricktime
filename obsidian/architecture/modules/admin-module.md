---
tags: [architecture, codebase-map]
updated: 2026-11-16
synced_commit: 7e98519
---

# Admin dashboard

### Admin dashboard — `admin/`

Purpose: operator back office for catalog, plans, orders and shipping, subscribers, gift cards and coupons, community moderation, CMS content and analytics. A separate Vite + React 19 + Tailwind v4 app with its own `package.json`, deployed with the storefront (root `build` script runs `pnpm --dir admin build`; Vercel rewrites `/admin` to `/admin/index.html`). Tracked as a plain directory in this repo (CLAUDE.md), not a submodule. Domain terms: **drop** (product), **tier**, **missing part request**, **merch order**, **challenge**, **points**.

Interface: SPA routes below, behind `RequireAuth`. The UI gate is `isAdminSession` (session email equals `VITE_ADMIN_EMAIL`, with a hardcoded fallback in source). Real authorisation is server-side: RLS policies use `app_metadata.role = 'admin'` and `lpexpress`, `lpexpress-sync`, `delete-subscriber` check the same claim. The two checks are different mechanisms (see [[deepening-candidates]]).

Depends on: [[database-module]] (direct `supabase.from(...)` everywhere), [[fulfilment-edge]] (`lpexpress`, `lpexpress-sync`, `delete-subscriber`, `get-analytics`), storage buckets `site-content` and `products`, own copy of `database.types.ts`.
Used by: operators.

<!-- auto:start module=admin -->
| Function / export | File:line | Signature (one line) | Does | Called from |
|---|---|---|---|---|
| Routes | `admin/src/App.tsx:31-55` | n/a | `/login`; `/`, `/analytics`, `/products`, `/content`, `/subscribers`, `/plans`, `/orders`, `/coupons`, `/achievements`, `/points`, `/community`, `/reviews`, `/challenges`, `/missing-parts`, `/merch`, `/gift-cards`, `/settings` | browser |
| `Dashboard` | `admin/src/pages/Dashboard.tsx:24` | page | Overview | route `/` |
| `Analytics` | `admin/src/pages/Analytics.tsx:118` | page | Calls `get-analytics` (GA4 + Search Console, recharts) | route |
| `Products` | `admin/src/pages/Products.tsx:46` | page | Product CRUD table; `ProductEditDialog` (`components/ProductEditDialog.tsx:94`) | route |
| `Content` | `admin/src/pages/Content.tsx:36` | page | CMS tabs: `HeroTab:26`, `HowItWorksTab:49`, `TestimonialsTab:59`, `FaqCtaTab:24`, `FaqQuestionsTab:50`, `MarqueeTab:60`, `CategoriesTab:45`, `PageHeadersTab:27`, `LegalPagesTab:93`, `HeadingEditor:18`, `MediaDropzone:17` (all under `components/content/`) | route |
| `Subscribers` | `admin/src/pages/Subscribers.tsx:59` | page | Members, delete via `delete-subscriber`; `SubscriberProfileSheet` (`components/SubscriberProfileSheet.tsx:72`, penalties) | route |
| `Plans` | `admin/src/pages/Plans.tsx:50` | page | Plan editor; `ComparisonTableEditor` (`components/plans/ComparisonTableEditor.tsx:69`) | route |
| `Orders` | `admin/src/pages/Orders.tsx:31` | page | Rental orders, labels, tracking sync; `OrderDetailSheet` (`components/OrderDetailSheet.tsx:46`) | route |
| `Merch` | `admin/src/pages/Merch.tsx:95` | page | Merch items and orders; `MerchOrdersPanel:33`, `MerchOrderDetailSheet:46` | route |
| `Coupons`, `GiftCards` | `admin/src/pages/Coupons.tsx:72`, `GiftCards.tsx:167` | pages | Discount codes; gift card list and expiry (`GiftCardExpiryDialog:24`) | routes |
| `Achievements`, `Points`, `Challenges`, `Community`, `Reviews`, `MissingParts` | `admin/src/pages/Achievements.tsx:114`, `Points.tsx:24`, `Challenges.tsx:126`, `Community.tsx:31`, `Reviews.tsx:31`, `MissingParts.tsx:27` | pages | Gamification, moderation (`reports`, `feed_items`), reviews, missing part requests | routes |
| `Settings`, `Login`, `Placeholder` | `admin/src/pages/Settings.tsx:12`, `Login.tsx:9`, `Placeholder.tsx:1` | pages | Settings, login, stub | routes |
| `AuthProvider`, `useAuth`, `isAdminSession`, `ADMIN_EMAIL` | `admin/src/context/AuthContext.tsx:27,56,10,6` | context | Session and admin gate | `RequireAuth`, `AppLayout` |
| `RequireAuth`, `AppLayout`, `AppSidebar`, `DataTable`, `DeleteDialog`, `DateTimePicker` | `admin/src/components/RequireAuth.tsx:4`, `AppLayout.tsx:27`, `AppSidebar.tsx:87`, `DataTable.tsx:62`, `DeleteDialog.tsx:19`, `DateTimePicker.tsx:47` | components | Shell and shared table | pages |
| `createLabel`, `fetchTracking`, `fetchLabelPdf`, `cancelShipment`, `downloadPdf` | `admin/src/lib/lpexpress.ts:22,32,38,44,49` | wrappers | Admin side of `lpexpress` | Orders, OrderDetailSheet |
| `uploadToStorage` | `admin/src/lib/upload-to-storage.ts:3` | `(file) => Promise<string>` | Upload to `site-content` | content tabs, Merch, Challenges |
| `supabase` | `admin/src/lib/supabase.ts:10` | client | Own anon client (session carries admin claim) | all |
<!-- auto:end -->

Counts: 18 routed pages (17 plus login), about 30 non-ui components, 6 lib functions groups. 25 shadcn primitives in `admin/src/components/ui/` not listed.

Notes (hand-written): `admin/src/data/{orders,products,subscribers}.ts` hold type and color maps plus static arrays (`products = []`; `orders` and `subscribers` arrays not checked, TODO). Files copied from the storefront: `series.ts`, `heading-markup.ts`, `vilnius-time.ts`, `lpexpress.ts` (types), `database.types.ts`. Admin analytics page shows "Edge Function error and no data" per CRM task dba2d7da (blocked, P3, see [[decisions-from-chat]]).
