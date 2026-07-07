---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "src/components/**"
  - "src/pages/**"
---

# Design System — admin dashboard

Clean, neutral, information-dense shadcn admin. **Deliberately not** the storefront's bold "brick"
look — no hard offset shadows, no brand colors, no display font, no `brick-*` classes. Optimize for
scannability and data density.

Tokens live in `src/index.css` (`@theme inline` + `:root` + `.dark`). **Never hardcode** a color,
radius, or font — use the semantic token or a shadcn component.

## Foundations

- **Color**: neutral grayscale via shadcn semantic tokens only — `background`, `foreground`, `card`,
  `muted`/`muted-foreground`, `border`, `primary`, `secondary`, `accent`, `destructive`, `ring`,
  `sidebar*`, `chart-1..5`. Values are `oklch()` neutrals. Use Tailwind classes (`bg-card`,
  `text-muted-foreground`, `border-border`) — never raw hex/oklch in components.
- **Dark mode**: fully supported via the `.dark` class (`@custom-variant dark`). Every color must
  work in both themes — always style through semantic tokens (which flip automatically) rather than
  literal light values.
- **Font**: Geist Variable — `font-sans` (also the heading font). No display/brand font here.
- **Radius**: base `--radius: 0.625rem` with the `--radius-sm..4xl` scale. Use `rounded-md`/`rounded-lg`.

## Components

- shadcn primitives in `src/components/ui/` (style `radix-nova`); add via `pnpm dlx shadcn@latest add <c>`.
- **Tables**: always use the shared `DataTable.tsx` (TanStack Table v8) for tabular data — don't hand-roll `<table>`.
- **Charts**: Recharts; color series with the `--chart-1..5` tokens, not arbitrary colors.
- **Detail/edit UX**: slide-over Sheets (`OrderDetailSheet`, `SubscriberProfileSheet`) and tabbed
  dialogs (`ProductEditDialog`) — follow these patterns for new detail/edit surfaces rather than full pages.
- Layout: everything nests under `AppLayout` + `AppSidebar`; new routes go inside that shell and behind `RequireAuth`.
- `cn()` from `src/lib/utils.ts` for conditional classes. Icons: Lucide.

## Conventions

- Keep it utilitarian: consistent spacing, muted separators, `muted-foreground` for secondary text.
- Match existing page structure (Products / Orders / Subscribers) when adding a new admin section.
