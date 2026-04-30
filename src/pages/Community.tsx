import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useReveal'
import {
  achievementDefs,
  feedItems as initialFeedItems,
  leaderboard,
  getRelativeTime,
  type FeedItem,
  type FeedEventType,
} from '@/data/community'

const studPattern = {
  backgroundImage: 'radial-gradient(circle at 12px 12px, rgba(255,255,255,.18) 3px, transparent 4px)',
  backgroundSize: '24px 24px',
}

const tierColors: Record<string, string> = {
  Mega: '#FB4903',
  Pro: '#4DA2FF',
  Standard: '#FFD731',
  Mini: '#FFAEE7',
  Nano: '#F5F1EB',
}

function eventLabel(type: FeedEventType, name: string, dropTitle?: string, body?: string): string {
  switch (type) {
    case 'checkin':    return `${name} aplankė šiandien`
    case 'build_photo': return `${name} pasidalino statyba`
    case 'comment':    return `${name} komentavo ${dropTitle ? `„${dropTitle}"` : 'produktą'}`
    case 'like':       return `${name} pamėgo statybą`
    case 'achievement': return `${name} atrakino pažymėjimą`
    case 'first_drop': return `${name} gavo pirmąjį produktą!`
    case 'streak':     return `${name} surinko ${body} dienų seriją 🔥`
  }
}

function LikeButton({ liked, count, onToggle }: { liked: boolean; count: number; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[13px] font-mono text-ink/50 transition-all hover:text-ink active:scale-110"
    >
      <span className={liked ? 'text-[#FB4903]' : ''}>{liked ? '❤️' : '🤍'}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

function FeedCard({ item, onLike }: { item: FeedItem; onLike: () => void }) {
  const def = item.achievementId ? achievementDefs.find((a) => a.id === item.achievementId) : null

  const accentColor =
    item.type === 'checkin' ? '#5DDB9C'
    : item.type === 'first_drop' ? '#FFD731'
    : item.type === 'streak' ? '#FB4903'
    : item.type === 'achievement' && def ? def.color
    : '#001B21'

  return (
    <div
      className="brick-card overflow-hidden"
      style={item.type === 'first_drop' ? { background: '#FFFBE6' } : undefined}
    >
      {/* Accent strip for checkin/streak */}
      {(item.type === 'checkin' || item.type === 'streak') && (
        <div className="h-1 w-full" style={{ background: accentColor }} />
      )}

      <div className="p-3 md:p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="size-9 shrink-0 rounded-full border-2 border-ink overflow-hidden"
            style={{ background: item.avatarBg }}
          >
            <img src={item.avatarSrc} alt={item.userName} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-ink leading-tight">
              {eventLabel(item.type, item.userName, item.dropTitle, item.body)}
            </p>
            <p className="font-mono text-[11px] text-ink/40 mt-0.5">{getRelativeTime(item.timestamp)}</p>
          </div>
        </div>

        {/* Body */}
        {item.type === 'comment' && item.body && (
          <blockquote
            className="mt-3 border-l-4 pl-3 text-[14px] text-ink/70 italic"
            style={{ borderColor: '#5DDB9C' }}
          >
            {item.body}
          </blockquote>
        )}

        {item.type === 'build_photo' && item.body && (
          <p className="mt-3 text-[14px] text-ink/70">{item.body}</p>
        )}

        {item.type === 'build_photo' && (
          <div
            className="mt-3 rounded-2xl border-2 border-ink overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            <img
              src={item.imageSrc ?? ''}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                const el = e.currentTarget.parentElement!
                el.style.background = '#5DDB9C'
                Object.assign(el.style, studPattern)
                e.currentTarget.remove()
              }}
            />
          </div>
        )}

        {item.type === 'achievement' && def && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 shadow-[3px_3px_0_#001B21]" style={{ background: def.color }}>
            {def.image
              ? <img src={def.image} alt={def.label} className="w-5 h-5 object-contain" />
              : <span>{def.icon}</span>
            }
            <span className="text-[13px] font-bold text-ink">{def.label}</span>
            <span className="font-mono text-[11px] text-ink/60">+{def.points} taškai</span>
          </div>
        )}

        {item.type === 'first_drop' && item.dropNum && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-d-md leading-none text-ink/20">
              №{item.dropNum}
            </span>
            <span className="text-[14px] font-bold text-ink">{item.dropTitle}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <LikeButton liked={item.likedByCurrentUser} count={item.likeCount} onToggle={onLike} />
          {item.dropNum && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink/30">
              Produktas № {item.dropNum}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function FeedPanel() {
  const [items, setItems] = useState<FeedItem[]>(initialFeedItems)

  function toggleLike(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              likedByCurrentUser: !item.likedByCurrentUser,
              likeCount: item.likedByCurrentUser ? item.likeCount - 1 : item.likeCount + 1,
            }
          : item
      )
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} onLike={() => toggleLike(item.id)} />
      ))}
      <button className="mt-2 w-full rounded-2xl border-2 border-dashed border-ink/30 py-4 font-mono text-[13px] text-ink/40 hover:border-ink/60 hover:text-ink/60 transition-all">
        Rodyti daugiau →
      </button>
    </div>
  )
}


function LeaderboardPanel() {
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div>
      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[top3[1], top3[0], top3[2]].map((entry, podiumIdx) => {
          const isCenter = podiumIdx === 1
          return (
            <div
              key={entry.userId}
              className={`rounded-2xl border-2 border-ink shadow-[4px_4px_0_#001B21] p-3 flex flex-col items-center text-center ${isCenter ? 'mt-0' : 'mt-5'}`}
              style={{ background: entry.avatarBg, ...studPattern }}
            >
              <p className="font-display text-d-xs leading-none text-paper/30 mb-2">
                #{entry.rank}
              </p>
              <div className="size-9 rounded-full border-2 border-paper/30 overflow-hidden mb-2">
                <img src={entry.avatarSrc} alt={entry.name} className="h-full w-full object-cover" />
              </div>
              <p className="font-bold text-[12px] text-paper leading-tight">{entry.name}</p>
              <div
                className="mt-1 rounded-full px-1.5 py-px text-[9px] font-bold border border-paper/20"
                style={{ background: tierColors[entry.tier] ?? '#FFD731', color: '#001B21' }}
              >
                {entry.tier}
              </div>
              <p className="font-display text-[16px] leading-none mt-2 text-paper">
                {entry.totalPoints}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/50">taškai</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="brick-card overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_60px_44px] bg-ink px-4 py-2.5 gap-3">
          {['#', 'Narys', 'Planas', 'pts'].map((col) => (
            <p key={col} className="font-mono text-[9px] uppercase tracking-widest text-paper/50">{col}</p>
          ))}
        </div>
        {rest.map((entry) => (
          <div
            key={entry.userId}
            className="grid grid-cols-[28px_1fr_60px_44px] items-center px-4 py-3 gap-3 border-b border-dashed border-ink/10 last:border-b-0 hover:bg-ink/[.03] transition-colors"
            style={entry.isCurrentUser ? { background: 'rgba(255,215,49,.12)' } : undefined}
          >
            <p className="font-display text-[16px] leading-none text-ink/40">
              {entry.rank}
            </p>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="size-6 shrink-0 rounded-full border border-ink/20 overflow-hidden"
                style={{ background: entry.avatarBg }}
              >
                <img src={entry.avatarSrc} alt={entry.name} className="h-full w-full object-cover" />
              </div>
              <span className="text-[12px] font-bold text-ink truncate">
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="ml-1 font-mono text-[9px] text-ink/40">→ Tu</span>
                )}
              </span>
            </div>
            <div>
              <span
                className="rounded-full px-1.5 py-px text-[9px] font-bold border border-ink/15"
                style={{ background: tierColors[entry.tier] ?? '#F5F1EB', color: '#001B21' }}
              >
                {entry.tier}
              </span>
            </div>
            <p className="font-display text-[16px] leading-none text-ink">
              {entry.totalPoints}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Community() {
  const heroRef = useReveal<HTMLDivElement>()
  const contentRef = useReveal<HTMLDivElement>()

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-paper py-4 md:py-6">
        <div ref={heroRef} className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="rounded-2xl md:rounded-3xl border-2 border-ink bg-ink overflow-hidden p-6 md:p-10">
            <p className="label-mono text-paper/40">⬢ Bendruomenė</p>
            <h1 className="heading-display text-d-xl tracking-[-0.02em] mt-3 text-paper">
              Bendruomenė.
            </h1>
            <p className="mt-5 font-mono text-[15px] text-paper/50 tracking-[.04em]">
              Žaisk. Statyk. Dalinkis.
            </p>
          </div>
        </div>
      </section>

      {/* Content — leaderboard left, feed right */}
      <section className="bg-paper py-16">
        <div ref={contentRef} className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[40%_60%]">

            {/* Left — leaderboard, sticky */}
            <div className="md:sticky md:self-start md:max-h-[calc(100dvh-120px)] md:overflow-y-auto" style={{ top: '120px' }}>
              <p className="label-mono text-ink/50 mb-6">⬢ Lyderiai</p>
              <LeaderboardPanel />
            </div>

            {/* Right — feed */}
            <div>
              <p className="label-mono text-ink/50 mb-6">⬢ Srautas</p>
              <FeedPanel />
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
