# CLAUDE.md

BRICKTIME **admin dashboard** — internal tool for products, subscribers, orders, plans, coupons,
gift cards, missing parts, merch, settings. Separate app from the storefront (its own repo,
consumed as a git submodule by `bricktime`).
React 19 · Vite 7 · TS · Tailwind v4 (`@tailwindcss/vite`, no config file) · shadcn `radix-nova` · TanStack Table v8 · Recharts.

## Commands (pnpm)

```bash
pnpm dev          # dev server
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm format       # prettier --write
```

## Layout

`src/` — `pages/`, `components/` (+ `components/ui/` shadcn), `lib/`, `hooks/`, `context/`, `data/`. Alias `@/` → `src/`.
Every route nests under `AppLayout` (sidebar shell via `AppSidebar`); auth-gated by `RequireAuth`.

Key shared components: `DataTable.tsx` (TanStack Table wrapper — Products/Subscribers/Orders), `ProductEditDialog.tsx` (tabbed add/edit sheet), `OrderDetailSheet.tsx` (slide-over w/ status sync), `SubscriberProfileSheet.tsx`.

## Data

Supabase for auth/DB (client in `src/lib/`). Some pages still use mock data in `src/data/`. Secrets via env — never hardcode.

## Design system

Clean, neutral shadcn admin (distinct from the storefront's bold brick look) — full reference in
`.claude/rules/design.md` (auto-loads when editing `src/`). Uses semantic shadcn tokens + Geist font,
**supports dark mode**. Use `DataTable` for any tabular view; Recharts for charts. Don't import
storefront `brick-*` classes here.
