import { useState, useRef, useEffect } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useReveal'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { avatarSrc } from '@/lib/avatars'
import {
  achievementDefs,
  leaderboard,
  getRelativeTime,
  type FeedEventType,
} from '@/data/community'

// ── Types ────────────────────────────────────────────────────────────────────

interface LiveFeedItem {
  id: string
  subscriber_id: string
  type: FeedEventType
  body: string | null
  image_url: string | null
  drop_num: number | null
  achievement_id: string | null
  like_count: number
  created_at: string
  user_name: string
  avatar_id: number
  avatar_bg: string
  likedByCurrentUser?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

function eventLabel(type: FeedEventType, name: string, dropTitle?: string | null, body?: string | null): string {
  switch (type) {
    case 'checkin':     return `${name} aplankė šiandien`
    case 'build_photo': return `${name} pasidalino statyba`
    case 'comment':     return `${name} komentavo${dropTitle ? ` „${dropTitle}"` : ''}`
    case 'like':        return `${name} pamėgo statybą`
    case 'achievement': return `${name} atrakino pažymėjimą`
    case 'first_drop':  return `${name} gavo pirmąjį produktą!`
    case 'streak':      return `${name} surinko ${body} dienų seriją 🔥`
  }
}

// ── LikeButton ────────────────────────────────────────────────────────────────

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

// ── FeedCard ──────────────────────────────────────────────────────────────────

function FeedCard({ item, onLike }: { item: LiveFeedItem; onLike: () => void }) {
  const def = item.achievement_id ? achievementDefs.find((a) => a.id === item.achievement_id) : null

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
      {(item.type === 'checkin' || item.type === 'streak') && (
        <div className="h-1 w-full" style={{ background: accentColor }} />
      )}

      <div className="p-3 md:p-5">
        <div className="flex items-center gap-3">
          <div
            className="size-9 shrink-0 rounded-full border-2 border-ink overflow-hidden"
            style={{ background: item.avatar_bg }}
          >
            <img src={avatarSrc(item.avatar_id)} alt={item.user_name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-ink leading-tight">
              {eventLabel(item.type, item.user_name, null, item.body)}
            </p>
            <p className="font-mono text-[11px] text-ink/40 mt-0.5">{getRelativeTime(item.created_at)}</p>
          </div>
        </div>

        {item.type === 'comment' && item.body && (
          <blockquote className="mt-3 border-l-4 pl-3 text-[14px] text-ink/70 italic" style={{ borderColor: '#5DDB9C' }}>
            {item.body}
          </blockquote>
        )}

        {item.type === 'build_photo' && item.body && (
          <p className="mt-3 text-[14px] text-ink/70">{item.body}</p>
        )}

        {item.type === 'build_photo' && item.image_url && (
          <div className="mt-3 rounded-2xl border-2 border-ink overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img
              src={item.image_url}
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

        {item.type === 'first_drop' && item.drop_num && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-d-md leading-none text-ink/20">№{item.drop_num}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <LikeButton liked={!!item.likedByCurrentUser} count={item.like_count} onToggle={onLike} />
          {item.drop_num && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink/30">
              Produktas № {item.drop_num}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ComposeBox ────────────────────────────────────────────────────────────────

interface ComposeBoxProps {
  avatarId: number
  avatarBg: string
  onPost: (text: string, imageFile?: File) => Promise<void>
}

function ComposeBox({ avatarId, avatarBg, onPost }: ComposeBoxProps) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setFocused(true)
  }

  function removeImage() {
    setImageFile(null)
    setPreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit() {
    if (!text.trim() && !imageFile) return
    setPosting(true)
    try {
      await onPost(text.trim(), imageFile ?? undefined)
      setText('')
      removeImage()
      setFocused(false)
    } finally {
      setPosting(false)
    }
  }

  const expanded = focused || !!text || !!previewUrl

  return (
    <div className={`brick-card p-4 transition-all ${expanded ? 'shadow-[6px_6px_0_#001B21]' : ''}`}>
      <div className="flex gap-3">
        <div className="size-9 shrink-0 rounded-full border-2 border-ink overflow-hidden" style={{ background: avatarBg }}>
          <img src={avatarSrc(avatarId)} alt="Aš" className="h-full w-full object-cover" />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => !text && !previewUrl && setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          placeholder="Pasidalink mintimis, statyba ar klausimu…"
          rows={expanded ? 3 : 1}
          className="flex-1 resize-none bg-transparent font-mono text-[14px] text-ink placeholder:text-ink/30 outline-none leading-relaxed"
        />
      </div>

      {previewUrl && (
        <div className="relative mt-3 rounded-2xl border-2 border-ink overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 size-7 rounded-full border-2 border-ink bg-paper flex items-center justify-center text-[12px] font-bold hover:bg-ink hover:text-paper transition-all"
          >
            ×
          </button>
        </div>
      )}

      {expanded && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink/40 hover:text-ink transition-colors">
              <span>🖼</span> Pridėti nuotrauką
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            <p className="font-mono text-[10px] text-ink/30">⌘+Enter siųsti</p>
          </div>
          <button
            onClick={submit}
            disabled={posting || (!text.trim() && !imageFile)}
            className="brick-hover-sm rounded-xl border-2 border-ink bg-ink px-4 py-1.5 font-mono text-[12px] font-bold text-paper disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {posting ? '…' : 'Skelbti'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── FeedPanel ─────────────────────────────────────────────────────────────────

function FeedPanel() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<LiveFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeed()

    const channel = supabase
      .channel('community_feed_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, () => fetchFeed())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feed_items' }, () => fetchFeed())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchFeed() {
    const { data } = await supabase
      .from('community_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setItems(data as LiveFeedItem[])
    setLoading(false)
  }

  async function toggleLike(item: LiveFeedItem) {
    if (!user) return

    if (item.likedByCurrentUser) {
      await supabase.from('feed_likes').delete().match({ feed_item_id: item.id, subscriber_id: user.id })
      await supabase.from('feed_items').update({ like_count: Math.max(0, item.like_count - 1) }).eq('id', item.id)
    } else {
      await supabase.from('feed_likes').insert({ feed_item_id: item.id, subscriber_id: user.id })
      await supabase.from('feed_items').update({ like_count: item.like_count + 1 }).eq('id', item.id)
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, likedByCurrentUser: !i.likedByCurrentUser, like_count: i.like_count + (i.likedByCurrentUser ? -1 : 1) }
          : i
      )
    )
  }

  async function addPost(text: string, imageFile?: File) {
    if (!user || !profile) return

    let imageUrl: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: uploaded } = await supabase.storage.from('community-images').upload(path, imageFile)
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('community-images').getPublicUrl(path)
        imageUrl = publicUrl
      }
    }

    await supabase.from('feed_items').insert({
      subscriber_id: user.id,
      type: imageFile ? 'build_photo' : 'comment',
      body: text || null,
      image_url: imageUrl,
    })

    await fetchFeed()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="brick-card p-5 animate-pulse">
            <div className="flex gap-3">
              <div className="size-9 shrink-0 rounded-full bg-ink/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-ink/10" />
                <div className="h-3 w-1/3 rounded bg-ink/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {user && profile ? (
        <ComposeBox avatarId={profile.avatarId} avatarBg={profile.avatarBg} onPost={addPost} />
      ) : (
        <div className="brick-card p-4 text-center">
          <p className="font-mono text-[13px] text-ink/50">Prisijunk norėdamas rašyti į srautą</p>
        </div>
      )}
      {items.map((item) => (
        <FeedCard key={item.id} item={item} onLike={() => toggleLike(item)} />
      ))}
      {items.length === 0 && (
        <p className="text-center font-mono text-[13px] text-ink/40 py-8">Kol kas tuščia. Būk pirmas!</p>
      )}
    </div>
  )
}

// ── LeaderboardPanel ──────────────────────────────────────────────────────────

function LeaderboardPanel() {
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[top3[1], top3[0], top3[2]].map((entry, podiumIdx) => {
          const isCenter = podiumIdx === 1
          return (
            <div
              key={entry.userId}
              className={`rounded-2xl border-2 border-ink shadow-[4px_4px_0_#001B21] p-3 flex flex-col items-center text-center ${isCenter ? 'mt-0' : 'mt-5'}`}
              style={{ background: entry.avatarBg, ...studPattern }}
            >
              <p className="font-display text-d-xs leading-none text-paper/30 mb-2">#{entry.rank}</p>
              <div className="size-9 rounded-full border-2 border-paper/30 overflow-hidden mb-2">
                <img src={entry.avatarSrc} alt={entry.name} className="h-full w-full object-cover" />
              </div>
              <p className="font-bold text-[12px] text-paper leading-tight">{entry.name}</p>
              <div className="mt-1 rounded-full px-1.5 py-px text-[9px] font-bold border border-paper/20" style={{ background: tierColors[entry.tier] ?? '#FFD731', color: '#001B21' }}>
                {entry.tier}
              </div>
              <p className="font-display text-[16px] leading-none mt-2 text-paper">{entry.totalPoints}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/50">taškai</p>
            </div>
          )
        })}
      </div>

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
            <p className="font-display text-[16px] leading-none text-ink/40">{entry.rank}</p>
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 shrink-0 rounded-full border border-ink/20 overflow-hidden" style={{ background: entry.avatarBg }}>
                <img src={entry.avatarSrc} alt={entry.name} className="h-full w-full object-cover" />
              </div>
              <span className="text-[12px] font-bold text-ink truncate">
                {entry.name}
                {entry.isCurrentUser && <span className="ml-1 font-mono text-[9px] text-ink/40">→ Tu</span>}
              </span>
            </div>
            <div>
              <span className="rounded-full px-1.5 py-px text-[9px] font-bold border border-ink/15" style={{ background: tierColors[entry.tier] ?? '#F5F1EB', color: '#001B21' }}>
                {entry.tier}
              </span>
            </div>
            <p className="font-display text-[16px] leading-none text-ink">{entry.totalPoints}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Community() {
  const heroRef = useReveal<HTMLDivElement>()
  const contentRef = useReveal<HTMLDivElement>()

  return (
    <>
      <Nav />

      <section className="bg-paper py-4 md:py-6">
        <div ref={heroRef} className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="rounded-2xl md:rounded-3xl border-2 border-ink bg-ink overflow-hidden p-6 md:p-10">
            <h3 className="label-mono text-paper/40">⬢ Bendruomenė</h3>
            <h1 className="heading-display text-d-xl tracking-[-0.02em] mt-3 text-paper">Bendruomenė.</h1>
            <p className="mt-5 font-mono text-[15px] text-paper/50 tracking-[.04em]">Žaisk. Statyk. Dalinkis.</p>
          </div>
        </div>
      </section>

      <section className="bg-paper py-16">
        <div ref={contentRef} className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[40%_60%]">

            <div className="md:sticky md:self-start md:max-h-[calc(100dvh-120px)] md:overflow-y-auto" style={{ top: '120px' }}>
              <h3 className="label-mono text-ink/50 mb-6">⬢ Lyderiai</h3>
              <LeaderboardPanel />
            </div>

            <div>
              <h3 className="label-mono text-ink/50 mb-6">⬢ Srautas</h3>
              <FeedPanel />
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
