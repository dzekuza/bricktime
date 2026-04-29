import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useReveal } from '@/hooks/useReveal'

const plans = [
  { name: 'Nano',     monthlyPrice: 9,  annualPrice: 7,  bg: '#F5F1EB', textColor: '#001B21', accentColor: '#5DDB9C', perks: ['60–90 bricks', 'Build card', '4 stickers', 'Free shipping'] },
  { name: 'Mini',     monthlyPrice: 14, annualPrice: 11, bg: '#FFAEE7', textColor: '#001B21', accentColor: '#001B21', perks: ['120–180 bricks', '1 exclusive minifig', 'Build card + 8 stickers', 'Free shipping'] },
  { name: 'Standard', monthlyPrice: 24, annualPrice: 19, bg: '#FFD731', textColor: '#001B21', accentColor: '#001B21', perks: ['240–320 bricks', '2 exclusive minifigs', '16 stickers', 'Trade-club access', 'Expedited shipping'] },
  { name: 'Pro',      monthlyPrice: 35, annualPrice: 28, bg: '#4DA2FF', textColor: '#001B21', accentColor: '#001B21', perks: ['340–400 bricks', '2 minifigs + alt colourway', '20 stickers', 'Early access drops', 'Expedited shipping'] },
  { name: 'Mega',     monthlyPrice: 55, annualPrice: 44, bg: '#FB4903', textColor: '#F5F1EB', accentColor: '#FFD731', perks: ['420–520 bricks', '3 minifigs + rare variant', 'Hardcover build book', 'Annual surprise box', 'All access'] },
]

const planIndex: Record<string, number> = { nano: 0, mini: 1, standard: 2, pro: 3, mega: 4 }

export default function Subscribe() {
  const [params] = useSearchParams()
  const initialPlan = planIndex[params.get('plan') ?? 'standard'] ?? 2

  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [step, setStep] = useState<'plan' | 'payment'>('plan')
  const [form, setForm] = useState({ email: '', card: '', expiry: '', cvc: '', name: '' })
  const [submitted, setSubmitted] = useState(false)

  const plan = plans[selectedPlan]
  const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  const total = billing === 'monthly' ? price : price * 10

  const heroRef = useReveal<HTMLDivElement>()

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <section className="py-20">
          <div className="mx-auto max-w-[1320px] px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className="flex flex-col items-center justify-center rounded-3xl border-2 border-ink p-16 shadow-[6px_6px_0_#001B21] text-center lg:col-span-12"
                style={{ background: '#5DDB9C', minHeight: 420 }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 80, color: '#001B21', lineHeight: 1 }}>✓</div>
                <h1
                  className="mt-6 uppercase text-ink"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,68px)', lineHeight: '.88' }}
                >
                  You're in the club.
                </h1>
                <p className="mt-5 max-w-[42ch] text-[17px] leading-[1.65] text-ink/70">
                  Welcome to BRICKTIME {plan.name}. Your first box ships with Drop № 26 — Mailbox Row.
                  Confirmation sent to <b>{form.email || 'your email'}</b>.
                </p>
                <div className="mt-10 flex flex-wrap gap-4 justify-center">
                  <Button asChild className="rounded-full border-2 border-ink bg-ink text-paper font-bold text-[15px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all">
                    <Link to="/account">Go to my account →</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-2 border-ink bg-transparent text-ink font-bold text-[15px] hover:bg-ink/5 transition-all">
                    <Link to="/drop/26">Preview drop № 26</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={heroRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div
              className="reveal flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-9 lg:col-span-7"
              style={{ background: '#001B21', minHeight: 280 }}
            >
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40">⬢ Start subscribing</p>
              <div>
                <h1
                  className="mt-4 uppercase text-paper"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px,4vw,68px)', lineHeight: '.88', letterSpacing: '-.015em' }}
                >
                  {step === 'plan' ? 'Pick your plan.' : 'Complete checkout.'}
                </h1>
                <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.65] text-paper/65">
                  {step === 'plan'
                    ? 'Five tiers. Cancel any month. Ships within 5 days of signing up.'
                    : `You're one step away from your first BRICKTIME ${plan.name} box.`}
                </p>
              </div>
              {/* Step indicator */}
              <div className="mt-8 flex items-center gap-3">
                {['Choose plan', 'Payment'].map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <div className={[
                      'flex items-center gap-2 rounded-full border-2 px-4 py-1.5 font-mono text-[11px] tracking-[.08em] uppercase transition-all',
                      (step === 'plan' ? i === 0 : i === 1) ? 'border-brand-yellow bg-brand-yellow text-ink' : 'border-paper/30 text-paper/40',
                    ].join(' ')}>
                      <span>{i + 1}</span>
                      <span>{s}</span>
                    </div>
                    {i === 0 && <span className="text-paper/30 font-mono">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary tile */}
            <div
              className="reveal flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-8 lg:col-span-5"
              style={{ background: plan.bg, minHeight: 280 }}
            >
              <p className="font-mono text-[11px] tracking-[.22em] uppercase" style={{ color: `${plan.textColor}60` }}>
                Selected plan
              </p>
              <div>
                <div
                  className="uppercase"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4vw,64px)', lineHeight: '.88', color: plan.textColor }}
                >
                  {plan.name}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: '.88', color: plan.textColor }}>
                    ${price}
                  </span>
                  <span className="font-mono text-[12px] tracking-[.06em] uppercase" style={{ color: `${plan.textColor}70` }}>/mo</span>
                </div>
                {billing === 'annual' && (
                  <p className="mt-1 font-mono text-[11px] tracking-[.06em] uppercase" style={{ color: `${plan.textColor}65` }}>
                    Billed ${total} today · saves ${(plan.monthlyPrice - plan.annualPrice) * 12}/yr
                  </p>
                )}
              </div>
              {/* Billing toggle */}
              <div className="mt-5 inline-flex items-center gap-1 self-start rounded-full border-2 border-ink bg-paper p-1">
                {(['monthly', 'annual'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setBilling(v)}
                    className={[
                      'rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[.06em] uppercase transition-all',
                      billing === v ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
                    ].join(' ')}
                  >
                    {v === 'monthly' ? 'Monthly' : 'Annual −17%'}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {step === 'plan' ? (
        /* ── Plan selection ─────────────────────────────────────────── */
        <section className="bg-paper py-20">
          <div className="mx-auto max-w-[1320px] px-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {plans.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedPlan(i)}
                  className={[
                    'relative flex flex-col justify-between rounded-3xl border-2 p-7 text-left transition-all',
                    selectedPlan === i
                      ? 'border-ink shadow-[6px_6px_0_#001B21] scale-[1.02]'
                      : 'border-ink/40 hover:border-ink hover:shadow-[4px_4px_0_#001B21]',
                  ].join(' ')}
                  style={{ background: p.bg, minHeight: 320 }}
                >
                  {i === 2 && (
                    <Badge className="absolute -top-3.5 right-5 rotate-1 rounded border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] tracking-[.08em] uppercase" style={{ background: '#001B21', color: '#F5F1EB' }}>
                      Popular
                    </Badge>
                  )}
                  {selectedPlan === i && (
                    <span className="absolute right-4 top-4 size-6 grid place-items-center rounded-full border-2 border-ink bg-ink text-paper text-[11px] font-bold">✓</span>
                  )}
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: '.88', color: p.textColor }}>{p.name}</div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: '.9', color: p.textColor }}>
                        ${billing === 'monthly' ? p.monthlyPrice : p.annualPrice}
                      </span>
                      <span className="font-mono text-[11px] tracking-[.06em] uppercase" style={{ color: `${p.textColor}70` }}>/mo</span>
                    </div>
                  </div>
                  <ul className="mt-5 flex flex-col gap-2">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-[13px]">
                        <span className="mt-[3px] size-2.5 shrink-0 rounded-full border-[1.5px]" style={{ background: p.accentColor, borderColor: p.textColor }} />
                        <span style={{ color: `${p.textColor}cc` }}>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="rounded-full border-2 border-ink bg-ink text-paper font-bold text-[16px] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all"
                onClick={() => setStep('payment')}
              >
                Continue with {plan.name} →
              </Button>
            </div>
          </div>
        </section>
      ) : (
        /* ── Payment form ───────────────────────────────────────────── */
        <section className="bg-paper py-20">
          <div className="mx-auto max-w-[1320px] px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

              {/* Form tile */}
              <div
                className="rounded-3xl border-2 border-ink p-10 shadow-[6px_6px_0_#001B21] lg:col-span-7"
                style={{ background: '#F5F1EB' }}
              >
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50 mb-7">⬢ Billing details</p>

                <div className="flex flex-col gap-5">
                  {/* Email */}
                  <div>
                    <label className="mb-2 block font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">Email address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:shadow-[4px_4px_0_#001B21] transition-all"
                    />
                  </div>

                  {/* Name on card */}
                  <div>
                    <label className="mb-2 block font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">Name on card</label>
                    <input
                      type="text"
                      placeholder="Alex Kim"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:shadow-[4px_4px_0_#001B21] transition-all"
                    />
                  </div>

                  {/* Card number */}
                  <div>
                    <label className="mb-2 block font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">Card number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={form.card}
                      onChange={(e) => setForm({ ...form, card: e.target.value })}
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:shadow-[4px_4px_0_#001B21] transition-all"
                    />
                  </div>

                  {/* Expiry + CVC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={form.expiry}
                        onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                        className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:shadow-[4px_4px_0_#001B21] transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">CVC</label>
                      <input
                        type="text"
                        placeholder="···"
                        value={form.cvc}
                        onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                        className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:shadow-[4px_4px_0_#001B21] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 rounded-full border-2 border-ink bg-ink text-paper font-bold text-[16px] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all"
                    onClick={() => setSubmitted(true)}
                  >
                    Start {plan.name} — ${billing === 'annual' ? `${total} today` : `${price}/mo`} →
                  </Button>
                </div>

                <p className="mt-4 text-center font-mono text-[11px] tracking-[.14em] uppercase text-ink/40">
                  SSL encrypted · cancel any time · 30-day money-back guarantee
                </p>
              </div>

              {/* Order summary */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                <div
                  className="rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21]"
                  style={{ background: plan.bg }}
                >
                  <p className="font-mono text-[11px] tracking-[.22em] uppercase" style={{ color: `${plan.textColor}60` }}>Order summary</p>
                  <div className="mt-5 flex flex-col gap-3 border-b border-dashed border-ink/30 pb-5">
                    <div className="flex justify-between text-[15px]" style={{ color: plan.textColor }}>
                      <span>{plan.name} plan ({billing})</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>${price}/mo</span>
                    </div>
                    {billing === 'annual' && (
                      <div className="flex justify-between text-[13px]" style={{ color: `${plan.textColor}70` }}>
                        <span>Billed annually (10 months)</span>
                        <span>−${(plan.monthlyPrice - plan.annualPrice) * 12} saved</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px]" style={{ color: `${plan.textColor}70` }}>
                      <span>Drop № 26 (this month)</span>
                      <span>Included</span>
                    </div>
                    <div className="flex justify-between text-[13px]" style={{ color: `${plan.textColor}70` }}>
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-baseline" style={{ color: plan.textColor }}>
                    <span className="text-[15px] font-bold">Due today</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1 }}>
                      ${billing === 'annual' ? total : price}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-3xl border-2 border-ink p-7"
                  style={{ background: '#F5F1EB' }}
                >
                  <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50 mb-4">What you're getting</p>
                  <ul className="flex flex-col gap-2">
                    {plan.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-[14px] text-ink">
                        <span className="size-2 shrink-0 rounded-full bg-brand-mint" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setStep('plan')}
                  className="text-center font-mono text-[12px] tracking-[.14em] uppercase text-ink/50 hover:text-ink transition-colors"
                >
                  ← Change plan
                </button>
              </div>

            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
