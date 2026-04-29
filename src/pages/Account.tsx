import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'

// ── mock user data ──────────────────────────────────────────────────────────
const user = {
  name: 'Alex Kim',
  email: 'alex.kim@example.com',
  initials: 'AK',
  avatarColor: '#4DA2FF',
  memberSince: 'Drop № 12 · March 2025',
  tier: 'Standard',
  tierBg: '#FFD731',
  tierTextColor: '#001B21',
  tierLevel: 3,
  nextBilling: 'June 5, 2026',
  monthlyPrice: 24,
  dropsReceived: 14,
}

const rentedDrops = [
  { num: 26, title: 'Mailbox Row', bg: '#5C4ADE', bricks: 312, status: 'Ships May 5' },
  { num: 25, title: 'The Greenhouse', bg: '#5DDB9C', bricks: 268, status: 'Delivered' },
  { num: 24, title: 'Donut Diner', bg: '#FFAEE7', bricks: 295, status: 'Delivered' },
  { num: 21, title: 'Lighthouse', bg: '#4DA2FF', bricks: 292, status: 'Delivered' },
]

const billingHistory = [
  { date: 'May 5, 2026',   amount: '$24', drop: 'Drop № 26', status: 'Paid' },
  { date: 'Apr 5, 2026',   amount: '$24', drop: 'Drop № 25', status: 'Paid' },
  { date: 'Mar 5, 2026',   amount: '$24', drop: 'Drop № 24', status: 'Paid' },
  { date: 'Feb 5, 2026',   amount: '$24', drop: 'Drop № 23', status: 'Paid' },
  { date: 'Jan 5, 2026',   amount: '$24', drop: 'Drop № 22', status: 'Paid' },
]

const tierOptions = [
  { name: 'Nano',     price: 9,  bg: '#F5F1EB', textColor: '#001B21', level: 1 },
  { name: 'Mini',     price: 14, bg: '#FFAEE7', textColor: '#001B21', level: 2 },
  { name: 'Standard', price: 24, bg: '#FFD731', textColor: '#001B21', level: 3 },
  { name: 'Pro',      price: 35, bg: '#4DA2FF', textColor: '#001B21', level: 4 },
  { name: 'Mega',     price: 55, bg: '#FB4903', textColor: '#F5F1EB', level: 5 },
]

// ── page ───────────────────────────────────────────────────────────────────
export default function Account() {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedTier, setSelectedTier] = useState(2) // Standard index

  const heroRef  = useReveal<HTMLDivElement>()
  const dropsRef = useReveal<HTMLDivElement>()
  const billingRef = useReveal<HTMLDivElement>()

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={heroRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* User tile */}
            <div
              className="reveal flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-9 lg:col-span-7"
              style={{ background: '#001B21', minHeight: 340 }}
            >
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div
                  className="shrink-0 size-[72px] rounded-full border-2 border-paper/30 grid place-items-center"
                  style={{ background: user.avatarColor }}
                >
                  <span
                    className="uppercase text-ink"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1 }}
                  >
                    {user.initials}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40">⬢ My account</p>
                  <h1
                    className="mt-2 uppercase text-paper"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,3.5vw,54px)', lineHeight: '.9' }}
                  >
                    {user.name}
                  </h1>
                  <p className="mt-1.5 text-[15px] text-paper/60">{user.email}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { val: user.dropsReceived, label: 'Drops received' },
                  { val: `${user.tierLevel}/5`, label: 'Tier level' },
                  { val: '14 mo', label: 'Member' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-paper/15 p-4">
                    <div
                      className="uppercase text-paper"
                      style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1 }}
                    >
                      {s.val}
                    </div>
                    <div className="mt-1 font-mono text-[10px] tracking-[.14em] uppercase text-paper/45">{s.label}</div>
                  </div>
                ))}
              </div>

              <p className="mt-5 font-mono text-[11px] tracking-[.16em] uppercase text-paper/35">
                Member since {user.memberSince}
              </p>
            </div>

            {/* Subscription tile */}
            <div
              className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_rgba(245,241,235,.12)] lg:col-span-5"
              style={{ background: user.tierBg, minHeight: 340 }}
            >
              <div>
                <p className="font-mono text-[11px] tracking-[.22em] uppercase" style={{ color: `${user.tierTextColor}70` }}>
                  Active subscription
                </p>
                <div
                  className="mt-3 uppercase"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,5vw,80px)', lineHeight: '.88', color: user.tierTextColor }}
                >
                  {user.tier}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: user.tierTextColor, lineHeight: 1 }}>
                    ${user.monthlyPrice}
                  </span>
                  <span className="font-mono text-[12px] tracking-[.06em] uppercase" style={{ color: `${user.tierTextColor}70` }}>
                    /mo
                  </span>
                </div>
                <p className="mt-3 text-[14px]" style={{ color: `${user.tierTextColor}80` }}>
                  Next billing: <b style={{ color: user.tierTextColor }}>{user.nextBilling}</b>
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-6">
                <Button
                  className="w-full rounded-full border-2 border-ink bg-ink text-paper font-bold text-[14px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all"
                  onClick={() => setShowUpgrade(!showUpgrade)}
                >
                  {showUpgrade ? 'Cancel change' : 'Upgrade / Change plan'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="rounded-full border-2 border-ink px-4 py-2.5 text-[12px] font-semibold text-ink transition-all hover:bg-ink/10">
                    Skip month
                  </button>
                  <button className="rounded-full border-2 border-ink px-4 py-2.5 text-[12px] font-semibold text-ink transition-all hover:bg-ink/10">
                    Pause
                  </button>
                </div>
              </div>
            </div>

            {/* Upgrade plan picker — shown inline when toggle is open */}
            {showUpgrade && (
              <div
                className="reveal rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] lg:col-span-12"
                style={{ background: '#F5F1EB' }}
              >
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50 mb-5">⬢ Change plan</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {tierOptions.map((t, i) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTier(i)}
                      className={[
                        'relative rounded-2xl border-2 p-5 text-left transition-all',
                        selectedTier === i ? 'border-ink scale-[1.02] shadow-[4px_4px_0_#001B21]' : 'border-ink/30 hover:border-ink',
                      ].join(' ')}
                      style={{ background: selectedTier === i ? t.bg : 'transparent' }}
                    >
                      {t.level === user.tierLevel && (
                        <span className="absolute -top-3 left-3 rounded-full border border-ink bg-ink px-2 py-0.5 font-mono text-[9px] tracking-[.1em] uppercase text-paper">
                          Current
                        </span>
                      )}
                      <div
                        style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, color: selectedTier === i ? t.textColor : '#001B21' }}
                      >
                        {t.name}
                      </div>
                      <div className="mt-1.5 font-mono text-[11px] tracking-[.06em] uppercase" style={{ color: selectedTier === i ? `${t.textColor}80` : '#001B2180' }}>
                        ${t.price}/mo
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <Button className="rounded-full border-2 border-ink bg-ink text-paper font-bold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all">
                    Confirm change to {tierOptions[selectedTier].name} →
                  </Button>
                  <button onClick={() => setShowUpgrade(false)} className="rounded-full border-2 border-ink px-5 py-2.5 text-[14px] font-semibold text-ink transition-all hover:bg-ink/5">
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── Active rentals ───────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={dropsRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div className="reveal lg:col-span-12">
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ My drops</p>
              <h2
                className="mt-3 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,3.5vw,58px)', lineHeight: '.88', letterSpacing: '-.015em' }}
              >
                Your rented drops.
              </h2>
            </div>

            {rentedDrops.map((drop, i) => (
              <Link
                key={drop.num}
                to={`/drop/${drop.num}`}
                className="reveal rounded-3xl border-2 border-ink overflow-hidden shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-3 no-underline"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* Top coloured area */}
                <div
                  className="relative flex items-end justify-between p-5"
                  style={{
                    background: drop.bg,
                    backgroundImage: 'radial-gradient(circle at 12px 12px, rgba(255,255,255,.18) 3px, transparent 4px)',
                    backgroundSize: '30px 30px',
                    minHeight: 140,
                  }}
                >
                  <div
                    className="rounded-[8px] border-2 border-ink bg-ink px-3 py-2 text-paper"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1 }}
                  >
                    № {drop.num}
                  </div>
                  <span
                    className={[
                      'rounded-full border border-ink px-2.5 py-1 font-mono text-[9px] tracking-[.12em] uppercase',
                      drop.status === 'Ships May 5' ? 'bg-brand-mint text-ink' : 'bg-paper/80 text-ink',
                    ].join(' ')}
                  >
                    {drop.status}
                  </span>
                </div>
                {/* Body */}
                <div className="bg-paper p-5">
                  <h3
                    className="uppercase text-ink"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: '.9' }}
                  >
                    {drop.title}
                  </h3>
                  <p className="mt-2 font-mono text-[11px] tracking-[.14em] uppercase text-ink/50">{drop.bricks} bricks</p>
                  <div className="mt-4 flex items-center justify-between text-[13px] font-bold text-ink">
                    <span>View drop</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>→</span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Browse more CTA */}
            <Link
              to="/archive"
              className="reveal flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-ink p-8 text-center transition-all hover:border-solid hover:shadow-[6px_6px_0_#001B21] lg:col-span-3 no-underline"
              style={{ minHeight: 220 }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: '#001B2140', lineHeight: 1 }}>+</span>
              <p className="text-[14px] font-bold text-ink">Browse more drops</p>
              <p className="font-mono text-[11px] tracking-[.14em] uppercase text-ink/45">26 available with Standard+</p>
            </Link>

          </div>
        </div>
      </section>

      {/* ── Upcoming drop ────────────────────────────────────────────── */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div
              className="flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-9 lg:col-span-8"
              style={{ background: '#5C4ADE', minHeight: 240 }}
            >
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/50">⬢ Shipping May 5</p>
              <div>
                <h2
                  className="uppercase text-paper"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,52px)', lineHeight: '.9' }}
                >
                  Drop № 26 — Mailbox Row + Postman Otto
                </h2>
                <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                  Included in your Standard box this month. 312 bricks, 2 exclusive minifigs.
                </p>
              </div>
              <Button asChild className="mt-6 w-fit rounded-full border-2 border-paper/40 bg-brand-yellow text-ink font-bold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_rgba(245,241,235,.3)] transition-all">
                <Link to="/drop/26">Preview drop →</Link>
              </Button>
            </div>

            <div
              className="flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-9 lg:col-span-4"
              style={{ background: '#001B21' }}
            >
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40">Quick actions</p>
              <div className="flex flex-col gap-2.5 mt-4">
                {[
                  { label: 'Skip June drop', color: '#5DDB9C' },
                  { label: 'Pause subscription', color: '#FFAEE7' },
                  { label: 'Gift a subscription', color: '#FFD731' },
                  { label: 'Cancel subscription', color: '#FB4903' },
                ].map((a) => (
                  <button
                    key={a.label}
                    className="flex items-center justify-between rounded-2xl border-2 border-paper/20 px-4 py-3 text-[13px] font-semibold text-paper transition-all hover:border-paper/50"
                  >
                    <span>{a.label}</span>
                    <span
                      className="size-3 rounded-full"
                      style={{ background: a.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Billing history ──────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={billingRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div className="reveal lg:col-span-12">
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ Billing</p>
              <h2
                className="mt-3 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,3.5vw,58px)', lineHeight: '.88', letterSpacing: '-.015em' }}
              >
                Payment history.
              </h2>
            </div>

            {/* Billing table */}
            <div
              className="reveal rounded-3xl border-2 border-ink overflow-hidden shadow-[6px_6px_0_#001B21] lg:col-span-8"
              style={{ background: '#F5F1EB' }}
            >
              <div className="grid grid-cols-4 border-b-2 border-ink bg-ink">
                {['Date', 'Drop', 'Amount', 'Status'].map((h) => (
                  <div key={h} className="p-4 font-mono text-[10px] tracking-[.18em] uppercase text-paper/60">{h}</div>
                ))}
              </div>
              {billingHistory.map((b, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 border-b border-dashed border-ink/20 last:border-b-0 hover:bg-ink/[.03] transition-colors"
                >
                  <div className="p-4 text-[14px] text-ink/70">{b.date}</div>
                  <div className="p-4 text-[14px] font-semibold text-ink">{b.drop}</div>
                  <div className="p-4 text-[14px] text-ink" style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{b.amount}</div>
                  <div className="p-4">
                    <span className="rounded-full border border-brand-mint bg-brand-mint/20 px-2.5 py-0.5 font-mono text-[10px] tracking-[.1em] uppercase text-ink">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Billing info card */}
            <div
              className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] lg:col-span-4"
              style={{ background: '#5DDB9C' }}
            >
              <div>
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">Payment method</p>
                <div className="mt-4 rounded-2xl border-2 border-ink bg-ink/10 p-4">
                  <p className="font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">Visa ending in</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#001B21', lineHeight: 1 }}>·· 4242</p>
                  <p className="mt-1 font-mono text-[11px] tracking-[.06em] uppercase text-ink/55">Expires 09/28</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <button className="rounded-full border-2 border-ink bg-ink px-5 py-3 text-[13px] font-bold text-paper transition-all hover:shadow-[4px_4px_0_#001B21]">
                  Update payment method
                </button>
                <button className="rounded-full border-2 border-ink px-5 py-3 text-[13px] font-semibold text-ink transition-all hover:bg-ink/10">
                  Download invoices
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
