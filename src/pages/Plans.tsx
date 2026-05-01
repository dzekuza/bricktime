import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ArrowRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'

// ── data ───────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Nano',
    tagline: 'Išbandyk vieną produktą.',
    monthlyPrice: 9,
    annualPrice: 7,
    bg: '#F5F1EB',
    textColor: '#001B21',
    accentColor: '#5DDB9C',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    perks: [
      { label: '60–90 aukštos kokybės ABS kaladėlių', included: true },
      { label: 'Surinkimo kortelė', included: true },
      { label: '4 vinilo lipdukai', included: true },
      { label: 'Nemokamas standartinis pristatymas', included: true },
      { label: 'Išskirtinis miniukas', included: false },
      { label: 'Keitimų klubo prieiga', included: false },
      { label: 'Ankstyva prieiga prie produktų', included: false },
      { label: 'Metinė staigmenos dėžutė', included: false },
    ],
    gridClass: 'lg:col-span-3',
    featured: false,
  },
  {
    name: 'Mini',
    tagline: 'Pilnas patyrimas.',
    monthlyPrice: 14,
    annualPrice: 11,
    bg: '#FFAEE7',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    perks: [
      { label: '120–180 aukštos kokybės ABS kaladėlių', included: true },
      { label: '1 išskirtinis miniukas', included: true },
      { label: 'Surinkimo kortelė + 8 vinilo lipdukai', included: true },
      { label: 'Nemokamas standartinis pristatymas', included: true },
      { label: 'Keitimų klubo prieiga', included: false },
      { label: 'Ankstyva prieiga prie produktų', included: false },
      { label: 'Metinė staigmenos dėžutė', included: false },
    ],
    gridClass: 'lg:col-span-3',
    featured: false,
  },
  {
    name: 'Standard',
    tagline: 'Čia gyvena dauguma kūrėjų.',
    monthlyPrice: 24,
    annualPrice: 19,
    bg: '#FFD731',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    perks: [
      { label: '240–320 aukštos kokybės ABS kaladėlių', included: true },
      { label: '2 išskirtiniai miniukai', included: true },
      { label: 'Surinkimo kortelė + 16 vinilo lipdukų', included: true },
      { label: 'Nemokamas skubus pristatymas', included: true },
      { label: 'Keitimų klubo prieiga', included: true },
      { label: 'Ankstyva prieiga prie produktų', included: false },
      { label: 'Metinė staigmenos dėžutė', included: false },
    ],
    gridClass: 'lg:col-span-6 lg:row-span-2',
    featured: true,
  },
  {
    name: 'Pro',
    tagline: 'Žengk aukštyn.',
    monthlyPrice: 35,
    annualPrice: 28,
    bg: '#4DA2FF',
    textColor: '#001B21',
    accentColor: '#001B21',
    ctaBg: '#001B21',
    ctaText: '#F5F1EB',
    perks: [
      { label: '340–400 aukštos kokybės ABS kaladėlių', included: true },
      { label: '2 išskirtiniai miniukai + alternatyvi spalva', included: true },
      { label: 'Surinkimo kortelė + 20 vinilo lipdukų', included: true },
      { label: 'Nemokamas skubus pristatymas', included: true },
      { label: 'Keitimų klubo prieiga', included: true },
      { label: 'Ankstyva prieiga prie produktų', included: true },
      { label: 'Metinė staigmenos dėžutė', included: false },
    ],
    gridClass: 'lg:col-span-3',
    featured: false,
  },
  {
    name: 'Mega',
    tagline: 'Eik iki galo.',
    monthlyPrice: 55,
    annualPrice: 44,
    bg: '#FB4903',
    textColor: '#F5F1EB',
    accentColor: '#FFD731',
    ctaBg: '#F5F1EB',
    ctaText: '#001B21',
    perks: [
      { label: '420–520 aukštos kokybės ABS kaladėlių', included: true },
      { label: '3 išskirtiniai miniukai + retas variantas', included: true },
      { label: 'Kieta surinkimo knyga', included: true },
      { label: 'Nemokamas skubus pristatymas', included: true },
      { label: 'Keitimų klubo prieiga', included: true },
      { label: 'Ankstyva prieiga prie produktų', included: true },
      { label: 'Metinė staigmenos dėžutė', included: true },
    ],
    gridClass: 'lg:col-span-3',
    featured: false,
  },
]

const trustTiles = [
  { label: 'Atšauk bet kada', body: 'Jokių mokesčių, jokio trinties. Vienas paspaudimas tavo paskyros skydelyje.', bg: '#5DDB9C', num: '01' },
  { label: 'Praleisk bet kurį mėnesį', body: 'Vyksti atostogų? Per metus galima praleisti iki 3 mėnesių, mokėjimas sustabdomas.', bg: '#FFAEE7', num: '02' },
  { label: '30 dienų garantija', body: 'Nepatiko pirmoji dėžutė — grąžinsime visą sumą, be jokių klausimų.', bg: '#4DA2FF', num: '03' },
  { label: 'Nemokamas pristatymas visame pasaulyje', body: 'Standartinis visuose planuose. Skubus Standard, Pro ir Mega planuose.', bg: '#FFD731', num: '04' },
]

const faqs = [
  { q: 'Kada išsiunčiama pirmoji dėžutė?', a: 'Užsakymai, pateikti iki mėnesio 15 d., išsiunčiami su einamojo mėnesio produktu. Po 15 d. — su kito mėnesio produktu.' },
  { q: 'Ar galiu keisti planą prenumeratos metu?', a: 'Taip — paaukštink arba sumažink planą bet kada iš savo skydelio. Pakeitimai įsigalioja nuo kito atsiskaitymo ciklo.' },
  { q: 'Kokius mokėjimo būdus priimate?', a: 'Priimame visas pagrindines kredito ir debeto korteles (Visa, Mastercard, Amex), PayPal ir Apple Pay.' },
  { q: 'Kaip veikia metinio atsiskaitymo nuolaida?', a: 'Metinis atsiskaitymas apmokestina už 10 mėnesių iš anksto ir suteikia 12 mėnesių produktų — iš esmės 2 mėnesiai nemokamai. Rodoma kaina yra mėnesio ekvivalentas.' },
  { q: 'Ar miniukai suderinami su standartinėmis kaladėlėmis?', a: 'Kiekviena BRICKTIME detalė yra 100 % suderinama su visomis pagrindinėmis kaladėlių sistemomis, kurias jau turi.' },
  { q: 'Ar pristatote į užsienį?', a: 'Pristatome į 42 šalis. Standartinis pristatymas nemokamas visur. Pristatymo laikas: 3–5 dienos (ES), 7–14 dienų (likęs pasaulis).' },
]

const comparisonRows = [
  { feature: 'Kaladėlių per produktą',   nano: '60–90',    mini: '120–180', standard: '240–320', pro: '340–400',   mega: '420–520' },
  { feature: 'Išskirtiniai miniukai',   nano: '—',        mini: '1',       standard: '2',       pro: '2 + alt',  mega: '3 + variantas' },
  { feature: 'Surinkimo kortelė',       nano: '✓',        mini: '✓',       standard: '✓',       pro: '✓',        mega: 'Kieta knyga' },
  { feature: 'Vinilo lipdukai',         nano: '4',        mini: '8',       standard: '16',      pro: '20',       mega: '24' },
  { feature: 'Pristatymas',             nano: 'Standartinis', mini: 'Standartinis', standard: 'Skubus', pro: 'Skubus', mega: 'Skubus' },
  { feature: 'Keitimų klubo prieiga',   nano: '—',        mini: '—',       standard: '✓',       pro: '✓',        mega: '✓' },
  { feature: 'Ankstyva prieiga prie produktų', nano: '—', mini: '—',       standard: '—',       pro: '✓',        mega: '✓' },
  { feature: 'Metinė staigmenos dėžutė', nano: '—',      mini: '—',       standard: '—',       pro: '—',        mega: '✓' },
]

// ── sub-components ─────────────────────────────────────────────────────────
function BillingToggle({ value, onChange }: { value: 'monthly' | 'annual'; onChange: (v: 'monthly' | 'annual') => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper p-1">
      {(['monthly', 'annual'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={[
            'rounded-full px-5 py-2 font-mono text-[12px] tracking-[.08em] uppercase transition-all',
            value === v ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
          ].join(' ')}
        >
          {v === 'monthly' ? 'Mėnesinis' : 'Metinis — taupyk 2 mėnesius'}
        </button>
      ))}
    </div>
  )
}

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b-2 border-dashed border-ink/20 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[16px] font-semibold text-ink leading-[1.4]">{q}</span>
        <span
          className="mt-0.5 shrink-0 size-7 grid place-items-center rounded-full border-2 border-ink text-ink"
          style={{ transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        className="overflow-hidden"
        style={{ transition: 'max-height .25s, opacity .2s', maxHeight: open ? 200 : 0, opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-[15px] leading-[1.65] text-ink/65">{a}</p>
      </div>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────
export default function PlansPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const heroRef = useReveal<HTMLDivElement>()
  const plansRef = useReveal<HTMLDivElement>()
  const compareRef = useReveal<HTMLDivElement>()
  const trustRef = useReveal<HTMLDivElement>()
  const faqRef = useReveal<HTMLDivElement>()

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-paper py-6">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={heroRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Main copy — col-7 */}
            <div
              className="reveal flex flex-col justify-between brick-card p-6 md:p-9 lg:col-span-7 min-h-[340px]"
              style={{ background: '#001B21' }}
            >
              <div>
                <h3 className="label-mono text-paper/50">⬢ Planai ir kainos</h3>
                <h1 className="heading-display text-d-xl tracking-[-0.015em] mt-5 text-paper">
                  Kaladėlės kiekvieną
                  <br />
                  mėnesį.{' '}
                  <span
                    className="inline-block bg-brand-yellow px-[.1em] text-ink"
                    style={{ transform: 'rotate(-1.5deg)' }}
                  >
                    Rinkis
                  </span>
                  <br />
                  savo lygį.
                </h1>
                <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.65] text-paper/70">
                  Penki planai — nuo pradedančiojo iki kolekcionieriaus. Jokių įsipareigojimų — atšauk, praleisk ar keisk bet kurį mėnesį.
                </p>
              </div>
              <div className="mt-8">
                <BillingToggle value={billing} onChange={setBilling} />
                {billing === 'annual' && (
                  <p className="mt-3 font-mono text-[11px] tracking-[.12em] uppercase text-brand-mint">
                    ✓ 2 mėnesiai nemokamai — apmokestinama kaip vienas metinis mokėjimas
                  </p>
                )}
              </div>
            </div>

            {/* Stats tile — col-5, row-span-2 */}
            <div
              className="reveal flex flex-col justify-between brick-card p-6 md:p-8 lg:col-span-5 lg:row-span-2 min-h-[340px]"
              style={{ background: '#5DDB9C' }}
            >
              <h3 className="label-mono text-ink/50">Bendruomenė</h3>

              <div className="flex flex-col gap-7">
                {[
                  { num: '12 400+', label: 'Aktyvūs prenumeratoriai' },
                  { num: '4.9 / 5', label: 'Vidutinis įvertinimas' },
                  { num: '26', label: 'Išsiųstų produktų' },
                  { num: '42', label: 'Šalių pasiekta' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-d-md leading-[.88] uppercase text-ink">
                      {s.num}
                    </div>
                    <div className="mt-1 font-mono text-[12px] tracking-[.1em] uppercase text-ink/55">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex">
                  {['#FB4903', '#FFAEE7', '#4DA2FF', '#FFD731'].map((c, i) => (
                    <span
                      key={c}
                      className="size-7 rounded-full border-2 border-ink"
                      style={{ background: c, marginLeft: i === 0 ? 0 : -6 }}
                    />
                  ))}
                </div>
                <p className="text-[13px] font-semibold text-ink">Kūrėjai visame pasaulyje</p>
              </div>
            </div>

            {/* Guarantee pill — col-7 */}
            <div
              className="reveal flex items-center gap-6 brick-card p-6 md:p-7 lg:col-span-7"
              style={{ background: '#FFD731' }}
            >
              <div className="shrink-0 font-display text-[64px] leading-none text-ink/20 select-none">
                ▩
              </div>
              <div>
                <p className="heading-display text-d-xs text-ink">
                  30 dienų pinigų grąžinimo garantija
                </p>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink/65">
                  Nepatiko pirmoji dėžutė? Grąžinsime visą sumą — be klausimų, be formų.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Plan cards ───────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={plansRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Tagline row */}
            <div
              className="reveal flex items-center justify-between rounded-2xl md:rounded-3xl border-2 border-paper/20 p-6 md:p-8 lg:col-span-12"
              style={{ background: '#FB4903' }}
            >
              <h2 className="heading-display text-d-lg tracking-[-0.015em] text-paper">
                Penki planai.
                <br />
                Viena visata.
              </h2>
              <div className="hidden lg:block">
                <BillingToggle value={billing} onChange={setBilling} />
              </div>
            </div>

            <div className="lg:col-span-12 flex flex-col lg:flex-row lg:-space-x-4">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className="reveal relative flex flex-col justify-between rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-8 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_rgba(245,241,235,.2)] flex-1 min-h-[420px]"
                style={{ background: plan.bg, transitionDelay: `-ems` }}
              >
                {plan.featured && (
                  <Badge
                    className="absolute -top-4 right-6 rotate-2 rounded border-2 border-ink px-3 py-1 font-mono text-[11px] tracking-[.08em] uppercase"
                    style={{ background: '#001B21', color: '#F5F1EB' }}
                  >
                    Populiariausias
                  </Badge>
                )}

                {/* Name + price */}
                <div>
                  <p
                    className="font-mono text-[11px] tracking-[.16em] uppercase"
                    style={{ color: `${plan.textColor}80` }}
                  >
                    {plan.tagline}
                  </p>
                  <div
                    className="mt-2 font-display text-d-xs leading-[.88] uppercase"
                    style={{ color: plan.textColor }}
                  >
                    {plan.name}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span
                      className="font-display text-d-md leading-[.88]"
                      style={{ color: plan.textColor }}
                    >
                      ${billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                    </span>
                    <span
                      className="font-mono text-[12px] tracking-[.06em] uppercase"
                      style={{ color: `${plan.textColor}80` }}
                    >
                      /mėn.
                    </span>
                  </div>
                  {billing === 'annual' && (
                    <p
                      className="mt-1.5 font-mono text-[11px] tracking-[.06em] uppercase"
                      style={{ color: `${plan.textColor}70` }}
                    >
                      mokama ${plan.annualPrice * 10}/metams — taupai ${(plan.monthlyPrice - plan.annualPrice) * 12}
                    </p>
                  )}
                </div>

                {/* Perks */}
                <ul className="mt-6 flex flex-col gap-2.5">
                  {plan.perks.map((perk) => (
                    <li
                      key={perk.label}
                      className="flex items-start gap-2.5 text-[14px]"
                      style={{ opacity: perk.included ? 1 : 0.3 }}
                    >
                      <span
                        className="mt-[3px] shrink-0 size-3 rounded-full border-2"
                        style={{
                          background: perk.included ? plan.accentColor : 'transparent',
                          borderColor: plan.textColor,
                        }}
                      />
                      <span style={{ color: `${plan.textColor}cc` }}>{perk.label}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className="mt-7 w-full rounded-full border-2 border-ink font-bold text-[14px] tracking-[.02em] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all"
                  style={{ background: plan.ctaBg, color: plan.ctaText }}
                  asChild
                >
                  <a href="#">Pradėti su {plan.name} <ArrowRightIcon data-icon="inline-end" /></a>
                </Button>
              </div>
            ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={compareRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div className="reveal lg:col-span-12">
              <h3 className="label-mono text-ink/50">⬢ Palyginimas</h3>
              <h2 className="heading-display text-d-lg tracking-[-0.015em] mt-3 text-ink">
                Viskas, greta.
              </h2>
            </div>

            <div
              className="reveal brick-card overflow-x-auto lg:col-span-12"
              style={{ background: '#F5F1EB' }}
            >
              <div className="min-w-[720px]">
                {/* Column headers */}
                <div className="grid border-b-2 border-ink" style={{ gridTemplateColumns: '2fr 1fr 1fr 1.4fr 1fr 1fr' }}>
                  <div className="p-3 md:p-5 font-mono text-[11px] tracking-[.18em] uppercase text-ink/40">Savybė</div>
                  {plans.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between border-l-2 border-ink p-4"
                      style={{ background: p.bg }}
                    >
                      <span
                        className="font-display text-[18px] leading-none uppercase"
                        style={{ color: p.textColor }}
                      >
                        {p.name}
                      </span>
                      {p.featured && (
                        <span className="font-mono text-[9px] tracking-[.1em] uppercase" style={{ color: `${p.textColor}60` }}>
                          Populiarus
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {comparisonRows.map((row) => (
                  <div
                    key={row.feature}
                    className="grid border-b-2 border-dashed border-ink/20 last:border-b-0 hover:bg-ink/[.03] transition-colors"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1.4fr 1fr 1fr' }}
                  >
                    <div className="p-4 text-[13px] font-semibold text-ink/70">{row.feature}</div>
                    {[row.nano, row.mini, row.standard, row.pro, row.mega].map((val, j) => (
                      <div
                        key={j}
                        className="flex items-center border-l-2 border-dashed border-ink/20 p-4 text-[13px] text-ink"
                      >
                        {val === '—' ? (
                          <span className="text-ink/25">—</span>
                        ) : val === '✓' ? (
                          <span className="size-5 grid place-items-center rounded-full border-2 border-ink bg-brand-mint text-[11px] font-bold text-ink">
                            ✓
                          </span>
                        ) : (
                          val
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Trust signals ────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={trustRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustTiles.map((t, i) => (
              <div
                key={t.num}
                className="reveal flex flex-col justify-between rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-8 shadow-[6px_6px_0_rgba(245,241,235,.12)] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_rgba(245,241,235,.2)] min-h-[220px]"
                style={{ background: t.bg, transitionDelay: `${i * 70}ms` }}
              >
                <span className="font-display text-[52px] leading-[.85] text-ink/20 select-none">
                  {t.num}
                </span>
                <div>
                  <h3 className="heading-display text-d-xs leading-[.92] text-ink">
                    {t.label}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink/65">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div ref={faqRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div
              className="reveal flex flex-col justify-between brick-card p-6 md:p-9 lg:col-span-4 min-h-[280px]"
              style={{ background: '#5C4ADE' }}
            >
              <h3 className="label-mono text-paper/50">⬢ Klausimai</h3>
              <div>
                <h2 className="heading-display text-d-md tracking-[-0.015em] text-paper">
                  Tai, ko
                  <br />
                  žmonės
                  <br />
                  klausia.
                </h2>
                <p className="mt-5 text-[14px] leading-[1.65] text-paper/65">
                  Vis dar neaišku? Rašyk mums{' '}
                  <a href="mailto:hi@bricktime.co" className="text-brand-yellow underline underline-offset-2">
                    hi@bricktime.co
                  </a>
                </p>
              </div>
            </div>

            <div
              className="reveal brick-card p-6 md:p-9 lg:col-span-8"
              style={{ background: '#F5F1EB' }}
            >
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div
              className="flex flex-col justify-between rounded-2xl md:rounded-3xl border-2 border-paper/20 p-10 lg:col-span-8 min-h-[300px]"
              style={{ background: '#FB4903' }}
            >
              <h3 className="label-mono text-paper/60">⬢ Produktas № 26 — išsiunčiama gegužės 5 d.</h3>
              <div>
                <h2 className="heading-display text-d-lg tracking-[-0.015em] text-paper">
                  Užsisakyk iki
                  <br />
                  gegužės 15 — gauk
                  <br />
                  Mailbox Row.
                </h2>
                <p className="mt-5 max-w-[44ch] text-[16px] leading-[1.6] text-paper/75">
                  Produktas № 26 — tai Mailbox Row + Postman Otto. 312 kaladėlių, 2 miniukai, vienas labai tenkinantis surinkimas.
                </p>
              </div>
            </div>

            <div
              className="flex flex-col justify-between rounded-2xl md:rounded-3xl border-2 border-paper/15 p-6 md:p-9 lg:col-span-4 min-h-[300px]"
              style={{ background: '#001B21' }}
            >
              <div>
                <h3 className="label-mono text-paper/50">Nuo</h3>
                <div className="font-display text-[72px] leading-[.88] mt-1 uppercase text-paper">
                  ${billing === 'monthly' ? 9 : 7}
                </div>
                <p className="mt-1 font-mono text-[11px] tracking-[.08em] uppercase text-paper/50">
                  per mėnesį{billing === 'annual' ? ' (metinis)' : ''}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <Button
                  className="w-full rounded-full border-2 border-paper/40 bg-brand-yellow text-ink font-bold text-[15px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_rgba(245,241,235,.3)] transition-all"
                  asChild
                >
                  <a href="#">Pradėti prenumeratą <ArrowRightIcon data-icon="inline-end" /></a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-2 border-paper/30 bg-transparent text-paper font-bold text-[15px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_rgba(245,241,235,.2)] transition-all"
                  asChild
                >
                  <a href="/drop/26">Peržiūrėti šį produktą <ArrowRightIcon data-icon="inline-end" /></a>
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
