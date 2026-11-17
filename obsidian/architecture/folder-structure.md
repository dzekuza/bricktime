---
tags: [architecture]
updated: 2026-11-18
---

# Folder Structure

Where everything lives and what belongs where. Verified against `git ls-files` at `9b4413c`.

```
src/
├── main.tsx, App.tsx   ← providers and routes (react-router-dom)
├── pages/              ← 20 route views (Checkout, Account, Community are 1400-2100 lines)
├── components/
│   ├── ui/             ← shadcn primitives
│   ├── account/ checkout/ community/ merch/ reviews/ coming-soon/   ← feature components
│   └── *.tsx           ← shared composed components (Nav, Hero, ProductCard, ...)
├── contexts/           ← Auth, Subscriptions, Consent, Breadcrumb
├── hooks/              ← 14 hooks — catalog: [[hooks]]
├── lib/                ← Supabase client, branding, time, function errors — catalog: [[utils]]
├── data/               ← static landing content
└── assets/
supabase/
├── functions/          ← 20 Deno edge functions + _shared/
├── migrations/         ← SQL, timestamp-named
└── config.toml         ← auth email templates, verify_jwt = false for stripe-webhook
admin/                  ← separate app (own package.json, vercel served under /admin)
obsidian/               ← this vault
```

There is no `app/`, `views/` or `utils/` folder; this repo is Vite, not Next.js.

## Rules

- Alias `@/` → `src/`.
- Component files are PascalCase (`ProductCard.tsx`), hooks `useX.ts`, libs kebab-case or camelCase mixed (`wait-for-subscriber.ts`, `anonSession.ts`).
- Enum aliases go in `src/lib/db-enums.ts`, never in `src/lib/database.types.ts` (regenerated wholesale).
- Check `ls supabase/migrations/` for timestamp collisions before adding a migration.

## Related

[[routing]] · [[component-conventions]] · [[codebase-map]]
