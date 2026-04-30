import { useSearchParams, Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// ── tier config ──────────────────────────────────────────────────────────────
const tiers = [
  { name: 'Nano',     price: 9,  bg: '#F5F1EB', textColor: '#001B21', level: 1 },
  { name: 'Mini',     price: 14, bg: '#FFAEE7', textColor: '#001B21', level: 2 },
  { name: 'Standard', price: 24, bg: '#FFD731', textColor: '#001B21', level: 3 },
  { name: 'Pro',      price: 35, bg: '#4DA2FF', textColor: '#001B21', level: 4 },
  { name: 'Mega',     price: 55, bg: '#FB4903', textColor: '#F5F1EB', level: 5 },
]
const tierByName: Record<string, typeof tiers[0]> = Object.fromEntries(tiers.map((t) => [t.name.toLowerCase(), t]))

// ── drop catalogue (minimal — just enough to render the summary) ─────────────
const drops: Record<string, { title: string; subtitle: string; bricks: number; minifigs: string; bg: string; requiredTier: string; date: string }> = {
  '26': { title: 'Mailbox Row', subtitle: '+ Postman Otto',   bricks: 312, minifigs: '2 minifigs', bg: '#5C4ADE', requiredTier: 'standard', date: 'Gegužė 2026' },
  '25': { title: 'The Greenhouse', subtitle: '+ Botanist Iris', bricks: 268, minifigs: '1 minifig', bg: '#5DDB9C', requiredTier: 'mini',     date: 'Balandis 2026' },
  '24': { title: 'Donut Diner', subtitle: '+ Chef Margo',     bricks: 295, minifigs: '2 minifigs', bg: '#FFAEE7', requiredTier: 'standard', date: 'Kovas 2026' },
  '23': { title: 'Pocket Sub',  subtitle: '+ Captain Reef',   bricks: 248, minifigs: '1 minifig',  bg: '#FFD731', requiredTier: 'mini',     date: 'Vasaris 2026' },
  '22': { title: 'Lander №7',   subtitle: '+ Astronaut Kai',  bricks: 274, minifigs: '1 minifig',  bg: '#FB4903', requiredTier: 'pro',      date: 'Sausis 2026' },
  '21': { title: 'Lighthouse',  subtitle: '+ Keeper Anya',    bricks: 292, minifigs: '2 minifigs', bg: '#4DA2FF', requiredTier: 'standard', date: 'Gruodis 2025' },
  '20': { title: 'The Big Wheel', subtitle: '+ Ringmaster Max', bricks: 412, minifigs: '3 minifigs', bg: '#001B21', requiredTier: 'mega',   date: 'Lapkritis 2025' },
  '19': { title: 'Field Tractor', subtitle: '+ Farmer Lou',   bricks: 222, minifigs: '1 minifig',  bg: '#5DDB9C', requiredTier: 'nano',    date: 'Spalis 2025' },
  '18': { title: 'Record Shop',  subtitle: '+ DJ Petra',      bricks: 264, minifigs: '1 minifig',  bg: '#FFAEE7', requiredTier: 'mini',    date: 'Rugsėjis 2025' },
}

// ── mock subscription state — in a real app this comes from auth context ────
// Default: user has Standard. Can be overridden by "?sub=none" query param.

export default function Checkout() {
  const [params] = useSearchParams()
  const dropNum  = params.get('drop') ?? '26'
  const tierParam = params.get('tier') ?? 'standard'
  const subParam  = params.get('sub')  // "none" = simulate not subscribed

  const drop = drops[dropNum]
  void (tierByName[tierParam] ?? tiers[2]) // tier param reserved for future use
  const requiredTier = tierByName[drop?.requiredTier ?? 'standard'] ?? tiers[2]

  // Mock: user is subscribed to Standard unless ?sub=none
  const [userSub] = useState(subParam === 'none' ? null : tiers[2])
  const isEligible = userSub !== null && userSub.level >= requiredTier.level
  const [confirmed, setConfirmed] = useState(false)

  if (!drop) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="mx-auto max-w-[1320px] px-7 py-32 text-center">
          <h1 className="uppercase text-ink" style={{ fontFamily: 'var(--font-display)', fontSize: 48 }}>Produktas nerastas</h1>
          <Link to="/archive" className="mt-6 inline-block text-ink underline">← Grįžti į produktus</Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <section className="py-20">
          <div className="mx-auto max-w-[1320px] px-7">
            <div
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-ink p-16 shadow-[6px_6px_0_#001B21] text-center"
              style={{ background: '#5DDB9C', minHeight: 420 }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 80, color: '#001B21', lineHeight: 1 }}>✓</div>
              <h2
                className="mt-6 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,68px)', lineHeight: '.88' }}
              >
                Produktas № {dropNum} pridėtas į tavo dėžutę!
              </h2>
              <p className="mt-5 max-w-[40ch] text-[17px] leading-[1.65] text-ink/70">
                <b>{drop.title}</b> eilėje tavo {userSub?.name} prenumeratoje. Įtrauksime į kitą siuntą.
              </p>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Button asChild className="rounded-full border-2 border-ink bg-ink text-paper font-bold text-[15px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all">
                  <Link to="/account">Žiūrėti mano produktus →</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-2 border-ink bg-transparent text-ink font-bold text-[15px] hover:bg-ink/5 transition-all">
                  <Link to="/archive">Naršyti daugiau produktų</Link>
                </Button>
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

      <section className="py-20">
        <div className="mx-auto max-w-[1320px] px-7">

          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2.5 font-mono text-[11px] tracking-[.18em] uppercase text-ink/50">
            <Link to="/" className="hover:text-ink transition-colors">BRICKTIME</Link>
            <span className="text-ink/30">/</span>
            <Link to="/archive" className="hover:text-ink transition-colors">Produktai</Link>
            <span className="text-ink/30">/</span>
            <Link to={`/drop/${dropNum}`} className="hover:text-ink transition-colors">Produktas № {dropNum}</Link>
            <span className="text-ink/30">/</span>
            <span className="text-ink/70 font-semibold">Užsakymas</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Drop preview tile */}
            <div
              className="rounded-3xl border-2 border-ink shadow-[6px_6px_0_#001B21] overflow-hidden lg:col-span-6"
              style={{ minHeight: 480 }}
            >
              {/* Coloured visual top */}
              <div
                className="relative flex flex-col items-center justify-end p-8"
                style={{
                  background: drop.bg,
                  backgroundImage: 'radial-gradient(circle at 16px 16px, rgba(255,255,255,.16) 4px, transparent 5px)',
                  backgroundSize: '40px 40px',
                  minHeight: 280,
                }}
              >
                <div
                  className="absolute left-6 top-6 rounded-[10px] border-2 border-ink bg-ink px-4 py-3 text-paper"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1 }}
                >
                  № {dropNum}
                </div>
                {/* Required tier badge */}
                <div
                  className="absolute right-6 top-6 rounded-full border-2 border-ink px-4 py-2 font-mono text-[11px] tracking-[.12em] uppercase font-bold"
                  style={{ background: requiredTier.bg, color: requiredTier.textColor }}
                >
                  {requiredTier.name}+ reikalingas
                </div>
                {/* Decorative brick stack */}
                <div className="flex items-end gap-2 pb-4">
                  {[60, 100, 70, 120, 50, 90].map((h, i) => (
                    <div
                      key={i}
                      className="relative rounded border-[2.5px] border-ink"
                      style={{ background: ['#FB4903','#F5F1EB','#FFD731','#5DDB9C','#FFAEE7','#4DA2FF'][i], width: 36, height: h, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.18)' }}
                    >
                      <span className="absolute -top-2.5 left-1/2 size-4 -translate-x-1/2 rounded-full border-[2.5px] border-ink" style={{ background: ['#FB4903','#F5F1EB','#FFD731','#5DDB9C','#FFAEE7','#4DA2FF'][i] }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Drop info */}
              <div className="bg-paper p-7">
                <h2
                  className="uppercase text-ink"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,48px)', lineHeight: '.9' }}
                >
                  {drop.title}<br />{drop.subtitle}
                </h2>
                <p className="mt-2 font-mono text-[11px] tracking-[.16em] uppercase text-ink/50">{drop.date}</p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[['Kaladėlių', drop.bricks], ['Miniukai', drop.minifigs.replace(' minifig', '').replace('s', ' fig')], ['Surinkimo laikas', '4–6h']].map(([label, val]) => (
                    <div key={label as string} className="rounded-2xl border-2 border-ink p-3 text-center">
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#001B21', lineHeight: 1 }}>{val}</div>
                      <div className="mt-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink/50">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order / subscription tile */}
            <div className="flex flex-col gap-4 lg:col-span-6">

              {/* Subscription status */}
              {userSub ? (
                <div
                  className="rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21]"
                  style={{ background: userSub.bg }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[11px] tracking-[.22em] uppercase" style={{ color: `${userSub.textColor}60` }}>Tavo prenumerata</p>
                      <div className="mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: '.9', color: userSub.textColor }}>
                        {userSub.name}
                      </div>
                    </div>
                    <span
                      className={[
                        'rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[11px] tracking-[.12em] uppercase font-bold',
                        isEligible ? 'bg-brand-mint text-ink' : 'bg-ink text-paper',
                      ].join(' ')}
                    >
                      {isEligible ? '✓ Tinkamas' : '✗ Reikalingas paaukštinimas'}
                    </span>
                  </div>

                  {isEligible ? (
                    <p className="mt-4 text-[14px] leading-[1.6]" style={{ color: `${userSub.textColor}80` }}>
                      Produktas № {dropNum} — <b>{drop.title}</b> įskaičiuotas į tavo <b>{userSub.name}</b> planą. Jokio papildomo mokesčio.
                    </p>
                  ) : (
                    <p className="mt-4 text-[14px] leading-[1.6]" style={{ color: `${userSub.textColor}80` }}>
                      Šiam produktui reikalingas <b>{requiredTier.name}+</b>. Tavo dabartinis planas yra <b>{userSub.name}</b>.
                      Paaukštink planą, kad galėtum pasiekti šį produktą.
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21]"
                  style={{ background: '#001B21' }}
                >
                  <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40">Neprenumeruojama</p>
                  <h3
                    className="mt-3 uppercase text-paper"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,2.5vw,40px)', lineHeight: '.9' }}
                  >
                    Prenumeruok, kad nuomotum šį produktą.
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-paper/65">
                    Produktas № {dropNum} reikalauja <b className="text-paper">{requiredTier.name}+</b> prenumeratos.
                    Nuo <b className="text-paper">${requiredTier.price}/mėn.</b>
                  </p>
                </div>
              )}

              {/* Action tile */}
              <div
                className="rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21]"
                style={{ background: '#F5F1EB' }}
              >
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50 mb-5">⬢ Nuomos suvestinė</p>

                <div className="flex flex-col gap-2.5 border-b border-dashed border-ink/20 pb-5">
                  {[
                    ['Produktas', `№ ${dropNum} — ${drop.title}`],
                    ['Reikalingas planas', `${requiredTier.name}+`],
                    ['Papildomas mokestis', 'Jokio — įskaičiuota į prenumeratą'],
                    ['Išsiunčiama', drop.date],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-start justify-between gap-4 text-[14px]">
                      <span className="text-ink/55">{label}</span>
                      <span className="text-right font-semibold text-ink">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <span className="text-[15px] font-bold text-ink">Mokėti šiandien</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: '#001B21', lineHeight: 1 }}>$0</span>
                </div>
                <p className="mt-1 font-mono text-[11px] tracking-[.1em] uppercase text-ink/40">Padengta tavo prenumeratos</p>

                {isEligible ? (
                  <Button
                    size="lg"
                    className="mt-6 w-full rounded-full border-2 border-ink bg-ink text-paper font-bold text-[16px] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all"
                    onClick={() => setConfirmed(true)}
                  >
                    Patvirtinti nuomą →
                  </Button>
                ) : userSub ? (
                  <Button asChild size="lg" className="mt-6 w-full rounded-full border-2 border-ink bg-brand-yellow text-ink font-bold text-[16px] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all">
                    <Link to={`/subscribe?plan=${requiredTier.name.toLowerCase()}`}>
                      Paaukštinti į {requiredTier.name} →
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="mt-6 w-full rounded-full border-2 border-ink bg-brand-yellow text-ink font-bold text-[16px] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21] transition-all">
                    <Link to={`/subscribe?plan=${requiredTier.name.toLowerCase()}`}>
                      Prenumeruoti {requiredTier.name} →
                    </Link>
                  </Button>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 font-mono text-[11px] tracking-[.14em] uppercase text-ink/40">
                  {['Atšauk bet kada', 'Nemokamas pristatymas', '30 dienų garantija'].map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-brand-mint" />{s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tier eligibility ladder */}
              <div
                className="rounded-3xl border-2 border-ink p-7"
                style={{ background: '#001B21' }}
              >
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40 mb-4">Kurie planai apima šį produktą</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {tiers.map((t) => {
                    const eligible = t.level >= requiredTier.level
                    return (
                      <div
                        key={t.name}
                        className={[
                          'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all',
                          eligible ? 'border-ink' : 'border-paper/15 opacity-35',
                        ].join(' ')}
                        style={{ background: eligible ? t.bg : 'transparent' }}
                      >
                        {eligible && (
                          <span className="text-[12px]" style={{ color: t.textColor }}>✓</span>
                        )}
                        <span
                          className="block font-mono text-[10px] tracking-[.1em] uppercase"
                          style={{ color: eligible ? t.textColor : 'rgba(245,241,235,.35)' }}
                        >
                          {t.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
