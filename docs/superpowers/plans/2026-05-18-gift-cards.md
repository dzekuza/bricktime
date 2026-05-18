# Gift Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/gift-cards` page where anyone can buy a gift card (€20–€200) via Stripe; recipient gets a unique code shown on-screen (and optionally by email); code can later be entered at checkout.

**Architecture:** Fixed-denomination tiles → inline purchase form → `create-gift-card-checkout` edge function generates a unique code, stores it in `gift_cards`, creates a Stripe Checkout session, and redirects. On payment success Stripe redirects back to `/gift-cards?payment=success&code=XXXX-XXXX-XXXX` where the code is displayed. A second `verify-gift-card` edge function allows future checkout pages to validate codes.

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Supabase (PostgreSQL + Edge Functions), Stripe (payment mode), Deno

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/20260518000006_gift_cards.sql` | Create `gift_cards` table + RLS |
| `supabase/functions/create-gift-card-checkout/index.ts` | New edge function — generate code, store row, create Stripe session |
| `supabase/functions/verify-gift-card/index.ts` | New edge function — validate a code, return amount |
| `vite-app/src/pages/GiftCards.tsx` | New page — denomination grid + purchase form + success state |
| `vite-app/src/App.tsx` | Add `/gift-cards` route |
| `vite-app/src/components/Nav.tsx` | Add "Dovanų kortelės" nav link |

---

## Task 1: Database migration — `gift_cards` table

**Files:**
- Create: `supabase/migrations/20260518000006_gift_cards.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260518000006_gift_cards.sql

create table gift_cards (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  amount_cents        int not null,
  recipient_email     text not null,
  buyer_email         text not null,
  message             text,
  status              text not null default 'active'
                        check (status in ('active', 'used', 'expired')),
  stripe_session_id   text,
  redeemed_by_user_id uuid references auth.users(id),
  redeemed_at         timestamptz,
  expires_at          timestamptz not null default (now() + interval '1 year'),
  created_at          timestamptz not null default now()
);

-- Service role only for insert/update (edge functions use service role key)
alter table gift_cards enable row level security;

-- Anyone can read a gift card row if they know the exact code (needed on success page)
create policy "Read gift card by code"
  on gift_cards for select
  using (true);

-- No direct public insert — edge functions bypass RLS via service role
create policy "Service role insert"
  on gift_cards for insert
  with check (false);

create policy "Service role update"
  on gift_cards for update
  using (false);
```

- [ ] **Step 2: Apply migration to local Supabase (if running locally), or push to remote**

```bash
# From repo root
supabase db push
```

Expected: migration applied, `gift_cards` table visible in Supabase Studio.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260518000006_gift_cards.sql
git commit -m "feat: add gift_cards table migration"
```

---

## Task 2: Edge function — `create-gift-card-checkout`

**Files:**
- Create: `supabase/functions/create-gift-card-checkout/index.ts`

- [ ] **Step 1: Create the function file**

```ts
// supabase/functions/create-gift-card-checkout/index.ts

import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function generateCode(): string {
  // 12 unambiguous uppercase alphanumeric chars, formatted as XXXX-XXXX-XXXX
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const raw = Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("")
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amountCents, recipientEmail, buyerEmail, message, successUrl, cancelUrl } =
      await req.json()

    if (!amountCents || !recipientEmail || !buyerEmail || !successUrl || !cancelUrl) {
      throw new Error("amountCents, recipientEmail, buyerEmail, successUrl, cancelUrl are required")
    }

    const validAmounts = [2000, 3000, 5000, 8000, 10000, 20000]
    if (!validAmounts.includes(amountCents)) {
      throw new Error("Invalid gift card amount")
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Generate unique code (retry on collision, extremely unlikely)
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("gift_cards")
        .select("id")
        .eq("code", code)
        .maybeSingle()
      if (!existing) break
      code = generateCode()
      attempts++
    }

    const amountEur = amountCents / 100

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `BRICKTIME dovanų kortelė — €${amountEur}`,
              description: `Gavėjas: ${recipientEmail}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: buyerEmail,
      // Stripe replaces {CHECKOUT_SESSION_ID} with the actual session ID
      success_url: successUrl
        .replace("{CODE}", encodeURIComponent(code))
        .replace("{SESSION_ID}", "{CHECKOUT_SESSION_ID}"),
      cancel_url: cancelUrl,
      metadata: { code, recipientEmail, buyerEmail },
    })

    // Store gift card row now — payment is confirmed by Stripe redirect
    await supabase.from("gift_cards").insert({
      code,
      amount_cents: amountCents,
      recipient_email: recipientEmail,
      buyer_email: buyerEmail,
      message: message ?? null,
      status: "active",
      stripe_session_id: session.id,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
```

**Note on `successUrl` templating:** The frontend passes:
```
`${origin}/gift-cards?payment=success&code={CODE}&session={SESSION_ID}`
```
The edge function replaces `{CODE}` with the actual code and leaves `{CHECKOUT_SESSION_ID}` for Stripe to replace. So the final success URL becomes:
```
/gift-cards?payment=success&code=ABCD-EFGH-JKLM&session=cs_live_...
```

- [ ] **Step 2: Deploy the edge function**

```bash
# From repo root
supabase functions deploy create-gift-card-checkout
```

Expected: `Deployed create-gift-card-checkout successfully`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-gift-card-checkout/index.ts
git commit -m "feat: add create-gift-card-checkout edge function"
```

---

## Task 3: Edge function — `verify-gift-card`

**Files:**
- Create: `supabase/functions/verify-gift-card/index.ts`

- [ ] **Step 1: Create the function file**

```ts
// supabase/functions/verify-gift-card/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    if (!code || typeof code !== "string") throw new Error("code is required")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: card, error } = await supabase
      .from("gift_cards")
      .select("id, code, amount_cents, status, expires_at")
      .eq("code", code.toUpperCase())
      .maybeSingle()

    if (error || !card) {
      return new Response(JSON.stringify({ valid: false, error: "Code not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (card.status === "used") {
      return new Response(JSON.stringify({ valid: false, error: "Code already used" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (card.status === "expired" || new Date(card.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Code expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({ valid: true, amountCents: card.amount_cents, code: card.code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy verify-gift-card
```

Expected: `Deployed verify-gift-card successfully`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/verify-gift-card/index.ts
git commit -m "feat: add verify-gift-card edge function"
```

---

## Task 4: Frontend page — `GiftCards.tsx`

**Files:**
- Create: `vite-app/src/pages/GiftCards.tsx`

- [ ] **Step 1: Create the page**

```tsx
// vite-app/src/pages/GiftCards.tsx

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const DENOMINATIONS = [
  { amount: 20, cents: 2000, tagline: 'Puikus pradžiamokslis' },
  { amount: 30, cents: 3000, tagline: 'Mažam kolekcionieriui' },
  { amount: 50, cents: 5000, tagline: 'Solidus pasirinkimas' },
  { amount: 80, cents: 8000, tagline: 'Dideliam džiaugsmui' },
  { amount: 100, cents: 10000, tagline: 'Premium dovana' },
  { amount: 200, cents: 20000, tagline: 'Legende lygio dovana' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border-2 border-ink/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-ink/50 transition-all hover:border-ink hover:text-ink"
    >
      {copied ? '✓ Nukopijuota' : 'Kopijuoti'}
    </button>
  )
}

function SuccessBanner({ code, recipientEmail }: { code: string; recipientEmail: string }) {
  return (
    <div className="brick-card flex flex-col gap-5 bg-[#5DDB9C] p-6 md:p-9">
      <div>
        <p className="label-mono mb-3 text-ink/60">Dovanų kortelė išsiųsta</p>
        <h2 className="heading-display text-d-md text-ink">✓ Mokėjimas gautas!</h2>
      </div>
      <p className="text-[16px] leading-relaxed text-ink/70">
        Dovanų kortelė skirta <strong className="text-ink">{recipientEmail}</strong>.
        Kodą pateik gavėjui — jis gali jį panaudoti užsisakydamas prenumeratą ar merch.
      </p>
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-paper p-5">
        <p className="label-mono text-ink/50">Dovanų kortelės kodas</p>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[28px] font-bold tracking-[.12em] text-ink md:text-[36px]">
            {code}
          </span>
          <CopyButton text={code} />
        </div>
      </div>
      <p className="font-mono text-[12px] text-ink/50">
        Galioja 1 metus nuo šiandienos. Kortelė taip pat išsiųsta gavėjui el. paštu.
      </p>
    </div>
  )
}

export default function GiftCards() {
  const [searchParams] = useSearchParams()
  const paymentSuccess = searchParams.get('payment') === 'success'
  const successCode = searchParams.get('code') ?? ''
  const [recipientEmailFromUrl] = useState(() => {
    // Recover recipient email from sessionStorage set before checkout
    return sessionStorage.getItem('gc_recipient') ?? ''
  })

  const [selected, setSelected] = useState<number | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleBuy() {
    if (selected === null || !recipientEmail || !buyerEmail) return
    setFormError('')
    setLoading(true)

    const denom = DENOMINATIONS.find((d) => d.cents === selected)
    if (!denom) { setLoading(false); return }

    const origin = window.location.origin
    // {CODE} and {SESSION_ID} are template vars replaced by the edge function / Stripe
    const successUrl = `${origin}/gift-cards?payment=success&code={CODE}&session={SESSION_ID}`
    const cancelUrl = `${origin}/gift-cards`

    // Persist recipient email so we can show it on the success page
    sessionStorage.setItem('gc_recipient', recipientEmail)

    const { data, error } = await supabase.functions.invoke('create-gift-card-checkout', {
      body: {
        amountCents: selected,
        recipientEmail,
        buyerEmail,
        message: message.trim() || null,
        successUrl,
        cancelUrl,
      },
    })

    setLoading(false)

    if (error || !data?.url) {
      setFormError('Klaida kuriant mokėjimą. Bandyk dar kartą.')
      return
    }

    window.location.href = data.url
  }

  const selectedDenom = DENOMINATIONS.find((d) => d.cents === selected)

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="overflow-hidden rounded-2xl border-2 border-ink bg-ink p-4 md:rounded-3xl md:p-6">
            <div className="brick-card brick-card-hover flex min-h-[320px] flex-col justify-between bg-ink p-6 md:p-9">
              <div className="label-mono mb-6 flex items-center gap-2.5">
                <Link to="/" className="text-paper/50 transition-colors hover:text-paper">
                  BRICKTIME
                </Link>
                <span className="text-paper/30">/</span>
                <span className="text-paper/50">Dovanų kortelės</span>
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <h1 className="heading-display text-d-xl max-w-[18ch] tracking-[-0.015em] text-paper">
                  DOVANK{' '}
                  <span
                    className="inline-block text-brand-yellow italic"
                    style={{ transform: 'skew(-8deg)' }}
                  >
                    LEGO džiaugsmą.
                  </span>
                </h1>
                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-paper/70">
                  Dovanos kortelę galima panaudoti užsisakant prenumeratą arba įsigyjant merch.
                  Galioja vienerius metus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-24 pt-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">

          {/* Success state */}
          {paymentSuccess && successCode ? (
            <div className="mb-10">
              <SuccessBanner code={successCode} recipientEmail={recipientEmailFromUrl} />
            </div>
          ) : null}

          {!paymentSuccess && (
            <>
              {/* Denomination grid */}
              <div className="mb-8">
                <span className="label-mono mb-5 inline-block text-ink/50">Pasirink sumą</span>
                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
                  {DENOMINATIONS.map((d) => {
                    const isSelected = selected === d.cents
                    return (
                      <button
                        key={d.cents}
                        onClick={() => setSelected(d.cents)}
                        className={[
                          'brick-card flex flex-col gap-2 p-5 text-left transition-all',
                          isSelected
                            ? 'bg-ink text-paper shadow-[6px_6px_0_#001B21] -translate-x-[3px] -translate-y-[3px]'
                            : 'bg-paper brick-card-hover',
                        ].join(' ')}
                      >
                        <span
                          className={`font-display text-[32px] font-bold uppercase leading-none ${isSelected ? 'text-paper' : 'text-ink'}`}
                        >
                          €{d.amount}
                        </span>
                        <span
                          className={`font-mono text-[11px] leading-snug ${isSelected ? 'text-paper/60' : 'text-ink/40'}`}
                        >
                          {d.tagline}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Purchase form — appears when a denomination is selected */}
              {selected !== null && (
                <div className="brick-card bg-paper p-6 md:p-9">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="heading-display text-d-sm text-ink">
                      €{selectedDenom?.amount} dovanų kortelė
                    </span>
                    <button
                      onClick={() => setSelected(null)}
                      className="label-mono ml-auto text-ink/30 transition-colors hover:text-ink"
                    >
                      Keisti
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 md:max-w-[560px]">
                    <div className="flex flex-col gap-1.5">
                      <label className="label-mono text-ink/50">
                        Gavėjo el. paštas <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="gavėjas@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="label-mono text-ink/50">
                        Asmeninis sveikinimas (neprivaloma)
                      </label>
                      <textarea
                        placeholder="Linkiu nuostabios kelionės su LEGO!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                        rows={3}
                        className="resize-none rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                      />
                      <span className="label-mono text-right text-ink/30">
                        {message.length}/140
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="label-mono text-ink/50">
                        Tavo el. paštas (kvitui) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="tavo@example.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                      />
                    </div>

                    {formError && (
                      <p className="font-mono text-[12px] text-red-500">{formError}</p>
                    )}

                    <button
                      disabled={!recipientEmail || !buyerEmail || loading}
                      onClick={handleBuy}
                      className="rounded-xl border-2 border-ink bg-ink py-4 font-mono text-[14px] font-bold uppercase tracking-[.08em] text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#001B21] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {loading ? 'Kraunama…' : `Pirkti €${selectedDenom?.amount} dovanų kortelę →`}
                    </button>

                    <p className="font-mono text-[11px] text-ink/35">
                      Mokėjimas apdorojamas saugiai per Stripe. Kortelė galioja 1 metus.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run typecheck from vite-app**

```bash
cd vite-app && pnpm typecheck
```

Expected: no errors in `GiftCards.tsx`

- [ ] **Step 3: Commit**

```bash
git add vite-app/src/pages/GiftCards.tsx
git commit -m "feat: add GiftCards page with denomination grid and purchase form"
```

---

## Task 5: Wire routing and Nav link

**Files:**
- Modify: `vite-app/src/App.tsx`
- Modify: `vite-app/src/components/Nav.tsx`

- [ ] **Step 1: Add route in `App.tsx`**

In `vite-app/src/App.tsx`, add the import after the existing `MerchDrop` import:

```tsx
import GiftCards from '@/pages/GiftCards'
```

Then add the route inside `<Routes>` after the `/merch/:slug` route:

```tsx
<Route path="/gift-cards" element={<GiftCards />} />
```

- [ ] **Step 2: Add nav link in `Nav.tsx`**

In `vite-app/src/components/Nav.tsx`, find the `links` array and add the gift cards entry after `Merch`:

```tsx
const links = [
  { label: 'Pradžia', to: '/' },
  { label: 'Produktai', to: '/archive' },
  { label: 'Merch', to: '/merch' },
  { label: 'Dovanų kortelės', to: '/gift-cards' },
  { label: 'Planai', to: '/subscribe' },
  { label: 'Bendruomenė', to: '/community' },
]
```

- [ ] **Step 3: Run typecheck**

```bash
cd vite-app && pnpm typecheck
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add vite-app/src/App.tsx vite-app/src/components/Nav.tsx
git commit -m "feat: wire /gift-cards route and nav link"
```

---

## Task 6: Smoke test in browser

**No code changes — manual verification only.**

- [ ] **Step 1: Start dev server**

```bash
cd vite-app && pnpm dev
```

- [ ] **Step 2: Verify the following in the browser**

1. `http://localhost:5173/gift-cards` loads without errors
2. Nav shows "Dovanų kortelės" link — active underline appears when on `/gift-cards`
3. Clicking a denomination tile selects it (dark background) and shows the purchase form below
4. Clicking a different denomination updates the selection
5. "Keisti" button clears the selection and hides the form
6. "Pirkti" button is disabled until both email fields are filled
7. Simulate success state: navigate to `http://localhost:5173/gift-cards?payment=success&code=ABCD-EFGH-JKLM` — the green success banner with the code and copy button appears
8. "Kopijuoti" button copies the code to clipboard and briefly shows "✓ Nukopijuota"

- [ ] **Step 3: Test Stripe checkout (requires live/test Stripe keys)**

Fill in valid test emails, click "Pirkti" — should redirect to Stripe Checkout hosted page. Complete payment with Stripe test card `4242 4242 4242 4242`. Should land back on `/gift-cards?payment=success&code=XXXX-XXXX-XXXX`.

Verify the code row exists in Supabase Studio → `gift_cards` table.

---

## Task 7: Commit edge functions to git root repo

The `supabase/functions/` directory lives in the root repo, not `vite-app/`. Ensure both edge functions are committed at the root level.

- [ ] **Step 1: Stage and commit from root**

```bash
# From repo root (not vite-app/)
git add supabase/functions/create-gift-card-checkout/ supabase/functions/verify-gift-card/
git status
git commit -m "feat: add gift card edge functions to root repo"
```

Expected: both function directories committed.

---

## Notes

- **Email delivery:** The edge function stores the code and Stripe handles buyer receipt. Recipient email delivery requires a transactional email provider (Resend, Postmark, or Supabase SMTP). This is a follow-up task — the code is shown prominently on-screen as the primary delivery mechanism for now.
- **Redemption wiring:** `verify-gift-card` is deployed and ready. Wiring a code-entry field into the Subscribe and Merch checkout pages is a separate follow-up task.
- **`{SESSION_ID}` in successUrl:** Stripe replaces `{CHECKOUT_SESSION_ID}` literally. The edge function replaces `{CODE}` before passing to Stripe, so the final template passed to Stripe is `...&code=ABCD-EFGH-JKLM&session={CHECKOUT_SESSION_ID}`. Stripe then replaces `{CHECKOUT_SESSION_ID}` with the real session ID.
