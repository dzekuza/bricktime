import { useState, useEffect } from 'react'
import { achievementDefs, calculatePoints } from '@/data/community'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'


// ── predefined avatars ──────────────────────────────────────────────────────
const avatarOptions = [
  { id: 0, src: '/avatars/avatar-classic.png', label: 'Klasikinis', bg: '#FFD731' },
  { id: 1, src: '/avatars/avatar-beanie.png',  label: 'Kepurėtas',  bg: '#FB4903' },
  { id: 2, src: '/avatars/avatar-ninja.png',   label: 'Nindzė',     bg: '#001B21' },
  { id: 3, src: '/avatars/avatar-robot.png',   label: 'Robotas',    bg: '#4DA2FF' },
  { id: 4, src: '/avatars/avatar-wizard.png',  label: 'Burtininkas', bg: '#5C4ADE' },
]

const tierOptions = [
  { name: 'Nano',     price: 9,  bg: '#F5F1EB', textColor: '#001B21', level: 1, key: 'nano' },
  { name: 'Mini',     price: 14, bg: '#FFAEE7', textColor: '#001B21', level: 2, key: 'mini' },
  { name: 'Standard', price: 24, bg: '#FFD731', textColor: '#001B21', level: 3, key: 'standard' },
  { name: 'Pro',      price: 35, bg: '#4DA2FF', textColor: '#001B21', level: 4, key: 'pro' },
  { name: 'Mega',     price: 55, bg: '#FB4903', textColor: '#F5F1EB', level: 5, key: 'mega' },
]

interface SubscriberData {
  plan: string
  status: string
  email: string
  joined_at: string
}

interface AchievementRecord { achievement_id: string }

// ── Achievements section ────────────────────────────────────────────────────
function AchievementsSection({ unlockedIds, totalPoints }: { unlockedIds: Set<string>; totalPoints: number }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <section className="bg-paper pt-4 pb-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.02em] text-ink">
          Taškai.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Points summary */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl md:rounded-3xl border-2 border-ink bg-ink p-3 md:p-8 shadow-[6px_6px_0_#FFD731]">
              <p className="font-display text-[72px] leading-none text-paper">{totalPoints}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-paper/40">Taškai iš viso</p>
              <div className="mt-6 rounded-2xl border border-paper/15 px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-paper/40">Lyderių lentelė</p>
                <p className="mt-1 text-[22px] font-bold text-paper"># –</p>
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
                    className="relative cursor-default rounded-2xl border-2 p-3 md:p-4 transition-all"
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
                    {def.image
                      ? <img src={def.image} alt={def.label} className="w-10 h-10 object-contain" />
                      : <p className="text-2xl">{def.icon}</p>
                    }
                    <p className="mt-2 text-[12px] font-bold text-ink leading-tight">{def.label}</p>
                    <p className="mt-1 font-mono text-[10px] text-ink/50">+{def.points} taškai</p>
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

// ── page ───────────────────────────────────────────────────────────────────
export default function Account() {
  const { user, profile } = useAuth()
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [postCount, setPostCount] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedTier, setSelectedTier] = useState(2)
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile?.avatarId ?? 0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  useEffect(() => {
    if (profile) setSelectedAvatarId(profile.avatarId)
  }, [profile])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('subscribers').select('plan, status, email, joined_at').eq('id', user.id).single(),
      supabase.from('user_achievements').select('achievement_id').eq('subscriber_id', user.id),
      supabase.from('feed_items').select('id', { count: 'exact' }).eq('subscriber_id', user.id).is('parent_id', null),
    ]).then(([{ data: sub }, { data: ach }, { count }]) => {
      if (sub) {
        setSubscriber(sub as SubscriberData)
        const tierIdx = tierOptions.findIndex((t) => t.key === sub.plan)
        if (tierIdx >= 0) setSelectedTier(tierIdx)
      }
      if (ach) setUnlockedIds(new Set((ach as AchievementRecord[]).map((a) => a.achievement_id)))
      setPostCount(count ?? 0)
    })
  }, [user])

  const activeTier = subscriber ? (tierOptions.find((t) => t.key === subscriber.plan) ?? tierOptions[2]) : tierOptions[2]
  const activeAvatar = avatarOptions[selectedAvatarId] ?? avatarOptions[0]
  const totalPoints = calculatePoints([...unlockedIds].map((id) => ({ achievementId: id, unlockedAt: '' })))
  const memberSince = subscriber?.joined_at
    ? new Date(subscriber.joined_at).toLocaleDateString('lt-LT', { year: 'numeric', month: 'long' })
    : '–'

  async function saveAvatar(id: number) {
    setSelectedAvatarId(id)
    setShowAvatarPicker(false)
    if (!user) return
    await supabase.from('subscribers').update({ avatar_id: id, avatar_bg: avatarOptions[id].bg }).eq('id', user.id)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="font-mono text-ink/50 text-[14px]">Prisijunk norėdamas peržiūrėti paskyrą.</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-paper pt-6 pb-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* User tile */}
            <div className="flex flex-col rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-9 lg:col-span-7 bg-[#5ddb9c] min-h-[340px]">
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <button
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    className="group relative size-[72px] rounded-full border-2 border-ink/30 overflow-hidden transition-all hover:border-ink/70 hover:scale-105"
                    style={{ background: activeAvatar.bg }}
                    aria-label="Keisti avataras"
                  >
                    <img src={activeAvatar.src} alt={activeAvatar.label} className="h-full w-full object-cover object-top" />
                    <span className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-end justify-center pb-1.5">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[8px] tracking-[.1em] uppercase text-ink font-bold">Keisti</span>
                    </span>
                  </button>
                </div>
                <div className="flex-1">
                  <h1 className="heading-display text-d-lg leading-[.9] mt-2 text-ink">
                    {profile?.name ?? user.email?.split('@')[0]}
                  </h1>
                  <p className="mt-1.5 text-[15px] text-ink/60">{subscriber?.email ?? user.email}</p>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="mt-5 rounded-2xl border border-ink/15 bg-ink/5 p-4">
                  <p className="mb-3 font-mono text-[10px] tracking-[.18em] uppercase text-ink/40">Pasirink avataras</p>
                  <div className="flex flex-wrap gap-3">
                    {avatarOptions.map((av) => (
                      <button key={av.id} onClick={() => saveAvatar(av.id)} className="flex flex-col items-center gap-1.5 transition-all">
                        <span
                          className={[
                            'size-14 rounded-full overflow-hidden border-2 transition-all',
                            selectedAvatarId === av.id
                              ? 'border-ink scale-110 shadow-[0_0_0_3px_rgba(0,27,33,.2)]'
                              : 'border-ink/20 hover:border-ink/60 hover:scale-105',
                          ].join(' ')}
                          style={{ background: av.bg, display: 'block' }}
                        >
                          <img src={av.src} alt={av.label} className="h-full w-full object-cover object-top" />
                        </span>
                        <span className="font-mono text-[9px] tracking-[.1em] uppercase text-ink/50">{av.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {[
                  { val: postCount, label: 'Įrašai' },
                  { val: `${activeTier.level}/5`, label: 'Plano lygis' },
                  { val: memberSince, label: 'Narys nuo' },
                  { val: totalPoints, label: 'Taškai' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-ink/20 bg-ink p-4">
                    <div className="font-display text-[18px] leading-tight uppercase text-paper">{s.val}</div>
                    <div className="mt-1 font-mono text-[10px] tracking-[.14em] uppercase text-paper/50">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription tile */}
            <div className="flex flex-col brick-card p-6 md:p-9 lg:col-span-5 min-h-[340px]" style={{ background: activeTier.bg }}>
              <div>
                <div className="font-display text-d-xl leading-[.88] mt-3 uppercase" style={{ color: activeTier.textColor }}>
                  {activeTier.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-d-sm leading-none" style={{ color: activeTier.textColor }}>${activeTier.price}</span>
                  <span className="font-mono text-[12px] tracking-[.06em] uppercase" style={{ color: `${activeTier.textColor}70` }}>/mėn.</span>
                </div>
                <p className="mt-3 text-[14px]" style={{ color: `${activeTier.textColor}80` }}>
                  Statusas: <b style={{ color: activeTier.textColor }}>{subscriber?.status ?? '–'}</b>
                </p>
              </div>

              <div className="mt-auto pt-6 flex gap-3 md:hidden">
                <button className="flex-1 rounded-full border-2 border-ink bg-ink px-3 py-2 text-[14px] font-bold text-paper transition-all hover:opacity-80">Atšaukti</button>
                <button className="flex-1 rounded-full border-2 border-ink bg-paper px-3 py-2 text-[14px] font-bold text-ink transition-all hover:bg-ink/5">Keisti</button>
              </div>
              <div className="hidden md:flex gap-2.5 mt-auto">
                <button
                  className="flex-1 rounded-full border-2 border-ink bg-ink px-3 py-2 text-[14px] font-bold text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_#001B21]"
                  onClick={() => setShowUpgrade(!showUpgrade)}
                >
                  Keisti planą
                </button>
                <button className="flex-1 rounded-full border-2 border-ink bg-paper px-3 py-2 text-[14px] font-bold text-ink transition-all hover:bg-ink/5">Atšaukti</button>
              </div>
            </div>

            {/* Upgrade plan picker */}
            {showUpgrade && (
              <div className="brick-card p-3 md:p-8 lg:col-span-12" style={{ background: '#F5F1EB' }}>
                <h3 className="label-mono text-ink/50 mb-5">⬢ Keisti planą</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {tierOptions.map((t, i) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTier(i)}
                      className={[
                        'relative rounded-2xl border-2 p-3 md:p-5 text-left transition-all',
                        selectedTier === i ? 'border-ink scale-[1.02] shadow-[4px_4px_0_#001B21]' : 'border-ink/30 hover:border-ink',
                      ].join(' ')}
                      style={{ background: selectedTier === i ? t.bg : 'transparent' }}
                    >
                      {t.key === subscriber?.plan && (
                        <span className="absolute -top-3 left-3 rounded-full border border-ink bg-ink px-2 py-0.5 font-mono text-[9px] tracking-[.1em] uppercase text-paper">
                          Dabartinis
                        </span>
                      )}
                      <div className="font-display text-[22px] leading-none" style={{ color: selectedTier === i ? t.textColor : '#001B21' }}>
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

      {/* ── Achievements ─────────────────────────────────────────────── */}
      <AchievementsSection unlockedIds={unlockedIds} totalPoints={totalPoints} />

      <Footer />
    </div>
  )
}
