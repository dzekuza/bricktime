import { useState } from 'react'
import { achievementDefs, currentUserAchievements, calculatePoints } from '@/data/community'
import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'

// ── predefined avatars ──────────────────────────────────────────────────────
const avatarOptions = [
  { id: 0, src: '/avatars/avatar-classic.png', label: 'Klasikinis', bg: '#FFD731' },
  { id: 1, src: '/avatars/avatar-beanie.png',  label: 'Kepurėtas',  bg: '#FB4903' },
  { id: 2, src: '/avatars/avatar-ninja.png',   label: 'Nindzė',     bg: '#001B21' },
  { id: 3, src: '/avatars/avatar-robot.png',   label: 'Robotas',    bg: '#4DA2FF' },
  { id: 4, src: '/avatars/avatar-wizard.png',  label: 'Burtininkas', bg: '#5C4ADE' },
]

// ── mock user data ──────────────────────────────────────────────────────────
const user = {
  name: 'Alex Kim',
  email: 'alex.kim@example.com',
  initials: 'AK',
  avatarColor: '#4DA2FF',
  memberSince: 'Produktas № 12 · kovas 2025',
  tier: 'Standard',
  tierBg: '#FFD731',
  tierTextColor: '#001B21',
  tierLevel: 3,
  nextBilling: 'Birželio 5, 2026',
  monthlyPrice: 24,
  dropsReceived: 14,
}

const rentedDrops = [
  { num: 26, title: 'Mailbox Row', bg: '#5C4ADE', bricks: 312, status: 'Išsiunčiama geg. 5' },
  { num: 25, title: 'The Greenhouse', bg: '#5DDB9C', bricks: 268, status: 'Pristatyta' },
  { num: 24, title: 'Donut Diner', bg: '#FFAEE7', bricks: 295, status: 'Pristatyta' },
  { num: 21, title: 'Lighthouse', bg: '#4DA2FF', bricks: 292, status: 'Pristatyta' },
]

const billingHistory = [
  { date: 'Geg. 5, 2026',   amount: '$24', drop: 'Produktas № 26', status: 'Apmokėta' },
  { date: 'Bal. 5, 2026',   amount: '$24', drop: 'Produktas № 25', status: 'Apmokėta' },
  { date: 'Kov. 5, 2026',   amount: '$24', drop: 'Produktas № 24', status: 'Apmokėta' },
  { date: 'Vas. 5, 2026',   amount: '$24', drop: 'Produktas № 23', status: 'Apmokėta' },
  { date: 'Sau. 5, 2026',   amount: '$24', drop: 'Produktas № 22', status: 'Apmokėta' },
]

const tierOptions = [
  { name: 'Nano',     price: 9,  bg: '#F5F1EB', textColor: '#001B21', level: 1 },
  { name: 'Mini',     price: 14, bg: '#FFAEE7', textColor: '#001B21', level: 2 },
  { name: 'Standard', price: 24, bg: '#FFD731', textColor: '#001B21', level: 3 },
  { name: 'Pro',      price: 35, bg: '#4DA2FF', textColor: '#001B21', level: 4 },
  { name: 'Mega',     price: 55, bg: '#FB4903', textColor: '#F5F1EB', level: 5 },
]

// ── page ───────────────────────────────────────────────────────────────────
function AchievementsSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const unlockedIds = new Set(currentUserAchievements.map((u) => u.achievementId))
  const totalPoints = calculatePoints(currentUserAchievements)

  return (
    <section className="py-20" style={{ background: '#F5F1EB' }}>
      <div className="mx-auto max-w-[1320px] px-7">
        <p className="font-mono text-[11px] uppercase tracking-[.22em] text-ink/50">⬢ Pažymėjimai</p>
        <h2
          className="mt-2 uppercase text-ink"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 64px)', lineHeight: '.9', letterSpacing: '-.02em' }}
        >
          Tavo ženkleliai.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Points summary */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border-2 border-ink bg-ink p-8 shadow-[6px_6px_0_#FFD731]">
              <p
                className="leading-none text-paper"
                style={{ fontFamily: 'var(--font-display)', fontSize: 72 }}
              >
                {totalPoints}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-paper/40">Taškai iš viso</p>
              <div className="mt-6 rounded-2xl border border-paper/15 px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-paper/40">Lyderių lentelė</p>
                <p className="mt-1 text-[22px] font-bold text-paper"># 5 vieta</p>
              </div>
              <a
                href="/community"
                className="mt-3 block text-center font-mono text-[11px] uppercase tracking-widest text-paper/40 hover:text-paper/70 transition-colors"
              >
                Žiūrėti lyderių lentelę →
              </a>
            </div>
          </div>

          {/* Badge grid */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {achievementDefs.map((def) => {
                const unlocked = unlockedIds.has(def.id)
                const hovered = hoveredId === def.id
                return (
                  <div
                    key={def.id}
                    className="relative cursor-default rounded-2xl border-2 p-4 transition-all"
                    style={{
                      background: unlocked ? def.color : 'transparent',
                      borderStyle: unlocked ? 'solid' : 'dashed',
                      borderColor: unlocked ? '#001B21' : 'rgba(0,27,33,.25)',
                      boxShadow: unlocked ? (hovered ? '6px 6px 0 #001B21' : '4px 4px 0 #001B21') : 'none',
                      opacity: unlocked ? 1 : 0.4,
                      filter: unlocked ? 'none' : 'grayscale(1)',
                      transform: hovered && unlocked ? 'translateY(-3px)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredId(def.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <p className="text-2xl">{def.icon}</p>
                    <p className="mt-2 text-[12px] font-bold text-ink leading-tight">{def.label}</p>
                    <p className="mt-1 font-mono text-[10px] text-ink/50">+{def.points} taškai</p>

                    {/* Tooltip */}
                    {hovered && (
                      <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-[4px_4px_0_#001B21]">
                        <p className="text-[12px] font-bold text-ink">{def.label}</p>
                        <p className="mt-0.5 text-[11px] text-ink/60">{def.description}</p>
                        <p className="mt-1 font-mono text-[10px] text-ink/40">+{def.points} taškai</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Account() {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedTier, setSelectedTier] = useState(2) // Standard index
  const [selectedAvatarId, setSelectedAvatarId] = useState(0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const activeAvatar = avatarOptions[selectedAvatarId]

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
                {/* Avatar — clickable */}
                <div className="shrink-0">
                  <button
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    className="group relative size-[72px] rounded-full border-2 border-paper/30 overflow-hidden transition-all hover:border-paper/70 hover:scale-105"
                    style={{ background: activeAvatar.bg }}
                    aria-label="Keisti avataras"
                  >
                    <img
                      src={activeAvatar.src}
                      alt={activeAvatar.label}
                      className="h-full w-full object-cover object-top"
                    />
                    <span className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-end justify-center pb-1.5">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[8px] tracking-[.1em] uppercase text-paper font-bold">
                        Keisti
                      </span>
                    </span>
                  </button>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40">⬢ Mano paskyra</p>
                  <h1
                    className="mt-2 uppercase text-paper"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,3.5vw,54px)', lineHeight: '.9' }}
                  >
                    {user.name}
                  </h1>
                  <p className="mt-1.5 text-[15px] text-paper/60">{user.email}</p>
                </div>
              </div>

              {/* Avatar picker */}
              {showAvatarPicker && (
                <div className="mt-5 rounded-2xl border border-paper/15 bg-paper/5 p-4">
                  <p className="mb-3 font-mono text-[10px] tracking-[.18em] uppercase text-paper/40">Pasirink avataras</p>
                  <div className="flex flex-wrap gap-3">
                    {avatarOptions.map((av) => (
                      <button
                        key={av.id}
                        onClick={() => { setSelectedAvatarId(av.id); setShowAvatarPicker(false) }}
                        className={[
                          'flex flex-col items-center gap-1.5 transition-all',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'size-14 rounded-full overflow-hidden border-2 transition-all',
                            selectedAvatarId === av.id
                              ? 'border-paper scale-110 shadow-[0_0_0_3px_rgba(245,241,235,.35)]'
                              : 'border-paper/20 hover:border-paper/60 hover:scale-105',
                          ].join(' ')}
                          style={{ background: av.bg, display: 'block' }}
                        >
                          <img
                            src={av.src}
                            alt={av.label}
                            className="h-full w-full object-cover object-top"
                          />
                        </span>
                        <span className="font-mono text-[9px] tracking-[.1em] uppercase text-paper/50">
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-4 gap-4">
                {[
                  { val: user.dropsReceived, label: 'Gauti produktai' },
                  { val: `${user.tierLevel}/5`, label: 'Plano lygis' },
                  { val: '14 mėn.', label: 'Narys' },
                  { val: calculatePoints(currentUserAchievements), label: 'Taškai' },
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
                Narys nuo {user.memberSince}
              </p>
            </div>

            {/* Subscription tile */}
            <div
              className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_rgba(245,241,235,.12)] lg:col-span-5"
              style={{ background: user.tierBg, minHeight: 340 }}
            >
              <div>
                <p className="font-mono text-[11px] tracking-[.22em] uppercase" style={{ color: `${user.tierTextColor}70` }}>
                  Aktyvi prenumerata
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
                    /mėn.
                  </span>
                </div>
                <p className="mt-3 text-[14px]" style={{ color: `${user.tierTextColor}80` }}>
                  Kitas mokėjimas: <b style={{ color: user.tierTextColor }}>{user.nextBilling}</b>
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-6">
                <Button
                  className="w-full rounded-full border-2 border-ink bg-ink text-paper font-bold text-[14px] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all"
                  onClick={() => setShowUpgrade(!showUpgrade)}
                >
                  {showUpgrade ? 'Atšaukti keitimą' : 'Paaukštinti / Keisti planą'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="rounded-full border-2 border-ink px-4 py-2.5 text-[12px] font-semibold text-ink transition-all hover:bg-ink/10">
                    Praleisti mėnesį
                  </button>
                  <button className="rounded-full border-2 border-ink px-4 py-2.5 text-[12px] font-semibold text-ink transition-all hover:bg-ink/10">
                    Pristabdyti
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
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50 mb-5">⬢ Keisti planą</p>
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
                          Dabartinis
                        </span>
                      )}
                      <div
                        style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, color: selectedTier === i ? t.textColor : '#001B21' }}
                      >
                        {t.name}
                      </div>
                      <div className="mt-1.5 font-mono text-[11px] tracking-[.06em] uppercase" style={{ color: selectedTier === i ? `${t.textColor}80` : '#001B2180' }}>
                        ${t.price}/mėn.
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <Button className="rounded-full border-2 border-ink bg-ink text-paper font-bold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21] transition-all">
                    Patvirtinti keitimą į {tierOptions[selectedTier].name} →
                  </Button>
                  <button onClick={() => setShowUpgrade(false)} className="rounded-full border-2 border-ink px-5 py-2.5 text-[14px] font-semibold text-ink transition-all hover:bg-ink/5">
                    Atšaukti
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
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ Mano produktai</p>
              <h2
                className="mt-3 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,3.5vw,58px)', lineHeight: '.88', letterSpacing: '-.015em' }}
              >
                Tavo nuomoti produktai.
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
                      drop.status === 'Išsiunčiama geg. 5' ? 'bg-brand-mint text-ink' : 'bg-paper/80 text-ink',
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
                  <p className="mt-2 font-mono text-[11px] tracking-[.14em] uppercase text-ink/50">{drop.bricks} kaladėlių</p>
                  <div className="mt-4 flex items-center justify-between text-[13px] font-bold text-ink">
                    <span>Žiūrėti produktą</span>
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
              <p className="text-[14px] font-bold text-ink">Naršyti daugiau produktų</p>
              <p className="font-mono text-[11px] tracking-[.14em] uppercase text-ink/45">26 prieinami su Standard+</p>
            </Link>

          </div>
        </div>
      </section>

      {/* ── Achievements ─────────────────────────────────────────────── */}
      <AchievementsSection />

      {/* ── Upcoming drop ────────────────────────────────────────────── */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <div
              className="flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-9 lg:col-span-8"
              style={{ background: '#5C4ADE', minHeight: 240 }}
            >
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/50">⬢ Išsiunčiama gegužės 5 d.</p>
              <div>
                <h2
                  className="uppercase text-paper"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,52px)', lineHeight: '.9' }}
                >
                  Produktas № 26 — Mailbox Row + Postman Otto
                </h2>
                <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                  Įskaičiuota į tavo Standard dėžutę šį mėnesį. 312 kaladėlių, 2 išskirtiniai miniukai.
                </p>
              </div>
              <Button asChild className="mt-6 w-fit rounded-full border-2 border-paper/40 bg-brand-yellow text-ink font-bold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_rgba(245,241,235,.3)] transition-all">
                <Link to="/drop/26">Peržiūrėti produktą →</Link>
              </Button>
            </div>

            <div
              className="flex flex-col justify-between rounded-3xl border-2 border-paper/15 p-9 lg:col-span-4"
              style={{ background: '#001B21' }}
            >
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/40">Greiti veiksmai</p>
              <div className="flex flex-col gap-2.5 mt-4">
                {[
                  { label: 'Praleisti birželio produktą', color: '#5DDB9C' },
                  { label: 'Pristabdyti prenumeratą', color: '#FFAEE7' },
                  { label: 'Dovanoti prenumeratą', color: '#FFD731' },
                  { label: 'Atšaukti prenumeratą', color: '#FB4903' },
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
              <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ Atsiskaitymas</p>
              <h2
                className="mt-3 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,3.5vw,58px)', lineHeight: '.88', letterSpacing: '-.015em' }}
              >
                Mokėjimų istorija.
              </h2>
            </div>

            {/* Billing table */}
            <div
              className="reveal rounded-3xl border-2 border-ink overflow-hidden shadow-[6px_6px_0_#001B21] lg:col-span-8"
              style={{ background: '#F5F1EB' }}
            >
              <div className="grid grid-cols-4 border-b-2 border-ink bg-ink">
                {['Data', 'Produktas', 'Suma', 'Būsena'].map((h) => (
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
                <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">Mokėjimo būdas</p>
                <div className="mt-4 rounded-2xl border-2 border-ink bg-ink/10 p-4">
                  <p className="font-mono text-[11px] tracking-[.14em] uppercase text-ink/60">Visa baigiasi</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#001B21', lineHeight: 1 }}>·· 4242</p>
                  <p className="mt-1 font-mono text-[11px] tracking-[.06em] uppercase text-ink/55">Galioja iki 09/28</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <button className="rounded-full border-2 border-ink bg-ink px-5 py-3 text-[13px] font-bold text-paper transition-all hover:shadow-[4px_4px_0_#001B21]">
                  Atnaujinti mokėjimo būdą
                </button>
                <button className="rounded-full border-2 border-ink px-5 py-3 text-[13px] font-semibold text-ink transition-all hover:bg-ink/10">
                  Atsisiųsti sąskaitas
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
