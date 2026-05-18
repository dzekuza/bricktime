import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useReveal'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { avatarSrc } from '@/lib/avatars'
import { ImageIcon, Heart, MessageCircle, Trash2 } from 'lucide-react'
import {
  achievementDefs,
  leaderboard,
  drops,
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
  plan: string | null
  parent_id: string | null
  likedByCurrentUser?: boolean
  replies?: LiveFeedItem[]
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
      className="flex items-center gap-1.5 font-mono text-[13px] transition-all hover:scale-105 active:scale-95"
      style={{ color: liked ? '#FB4903' : 'rgba(0,27,33,.4)' }}
    >
      <Heart size={15} fill={liked ? '#FB4903' : 'none'} strokeWidth={2} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

// ── FeedCard ──────────────────────────────────────────────────────────────────

function FeedCard({ item, onLike, onComment, isOwn, onDelete }: { item: LiveFeedItem; onLike: () => void; onComment: (text: string) => Promise<void>; isOwn: boolean; onDelete: () => void }) {
  const [showComment, setShowComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitComment() {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await onComment(commentText.trim())
      setCommentText('')
      setShowComment(false)
    } finally {
      setSubmitting(false)
    }
  }
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
          <Link to={`/profile/${item.subscriber_id}`} className="shrink-0">
            <div
              className="size-9 rounded-full border-2 border-ink overflow-hidden hover:opacity-80 transition-opacity"
              style={{ background: item.avatar_bg }}
            >
              <img src={avatarSrc(item.avatar_id)} alt={item.user_name} className="h-full w-full object-cover" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-bold text-ink leading-tight">
                <Link to={`/profile/${item.subscriber_id}`} className="hover:underline underline-offset-2">
                  {eventLabel(item.type, item.user_name, null, item.body)}
                </Link>
              </p>
              {item.plan && (
                <span
                  className="shrink-0 rounded-full border border-ink/20 px-2 py-0.5 font-mono text-[9px] tracking-[.1em] uppercase font-bold"
                  style={{ background: tierColors[item.plan.charAt(0).toUpperCase() + item.plan.slice(1)] ?? '#F5F1EB', color: item.plan === 'mega' ? '#F5F1EB' : '#001B21' }}
                >
                  {item.plan}
                </span>
              )}
            </div>
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
          <div className="flex items-center gap-3">
            <LikeButton liked={!!item.likedByCurrentUser} count={item.like_count} onToggle={onLike} />
            <button
              onClick={() => setShowComment((v) => !v)}
              className="flex items-center gap-1.5 font-mono text-[13px] transition-all hover:scale-105 active:scale-95"
              style={{ color: showComment ? '#001B21' : 'rgba(0,27,33,.4)' }}
            >
              <MessageCircle size={15} strokeWidth={2} />
            </button>
            {isOwn && (
              <button
                onClick={onDelete}
                className="flex items-center transition-all hover:scale-105 active:scale-95 text-ink/25 hover:text-[#FB4903]"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            )}
          </div>
          {item.drop_num && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink/30">
              Produktas № {item.drop_num}
            </span>
          )}
        </div>

        {(item.replies && item.replies.length > 0) && (
          <div className="mt-3 border-t border-dashed border-ink/10 pt-3 flex flex-col gap-2.5">
            {item.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5">
                <div className="size-6 shrink-0 rounded-full border border-ink/20 overflow-hidden mt-0.5" style={{ background: reply.avatar_bg }}>
                  <img src={avatarSrc(reply.avatar_id)} alt={reply.user_name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-bold text-ink">{reply.user_name} </span>
                  <span className="text-[13px] text-ink/70">{reply.body}</span>
                  <p className="font-mono text-[10px] text-ink/30 mt-0.5">{getRelativeTime(reply.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showComment && (
          <div className="mt-3 flex gap-2 border-t border-dashed border-ink/10 pt-3">
            <input
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
              placeholder="Parašyk komentarą…"
              className="flex-1 rounded-xl border border-ink/20 bg-transparent px-3 py-1.5 font-mono text-[13px] text-ink placeholder:text-ink/30 outline-none focus:border-ink/50"
            />
            <button
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
              className="rounded-xl border-2 border-ink bg-ink px-3 py-1.5 font-mono text-[12px] font-bold text-paper disabled:opacity-30 transition-all"
            >
              {submitting ? '…' : '↑'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ComposeBox ────────────────────────────────────────────────────────────────

interface ComposeBoxProps {
  avatarId: number
  avatarBg: string
  onPost: (text: string, imageFile?: File, dropNum?: number) => Promise<void>
}

function ComposeBox({ avatarId, avatarBg, onPost }: ComposeBoxProps) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [dropNum, setDropNum] = useState<string>("")
  const [showDropPicker, setShowDropPicker] = useState(false)
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
      await onPost(text.trim(), imageFile ?? undefined, dropNum ? parseInt(dropNum) : undefined)
      setText('')
      removeImage()
      setDropNum("")
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

      <input id="compose-file" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {expanded && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowDropPicker((v) => !v)}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[11px] transition-colors ${dropNum ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink/40 hover:text-ink hover:border-ink/40'}`}
              >
                {dropNum ? `№ ${dropNum}` : '№ produktas'}
              </button>
              {showDropPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50 rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_#001B21] p-3 w-64">
                  <p className="font-mono text-[9px] tracking-widest uppercase text-ink/40 mb-2">Pasirink produktą</p>
                  <div className="flex flex-col gap-1">
                    {drops.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setDropNum(String(d.id)); setShowDropPicker(false) }}
                        className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-all hover:scale-[1.01] ${String(d.id) === dropNum ? 'border-ink bg-ink text-paper' : 'border-ink/15 hover:border-ink/40'}`}
                      >
                        <span className="size-5 shrink-0 rounded-md border border-ink/20" style={{ background: d.bg }} />
                        <span className="flex-1 font-bold text-[12px] truncate" style={{ color: String(d.id) === dropNum ? '#F5F1EB' : '#001B21' }}>{d.title}</span>
                        <span className="font-mono text-[10px] shrink-0" style={{ color: String(d.id) === dropNum ? 'rgba(245,241,235,.5)' : 'rgba(0,27,33,.3)' }}>№{d.id}</span>
                      </button>
                    ))}
                  </div>
                  {dropNum && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setDropNum(''); setShowDropPicker(false) }}
                      className="mt-2 w-full rounded-lg border border-dashed border-ink/20 py-1 font-mono text-[10px] text-ink/40 hover:text-ink hover:border-ink/40 transition-colors"
                    >
                      Išvalyti
                    </button>
                  )}
                </div>
              )}
            </div>
            <label htmlFor="compose-file" className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink/40 hover:text-ink transition-colors" onMouseDown={(e) => e.preventDefault()}>
              <ImageIcon size={14} /> Pridėti nuotrauką
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feed_items' }, (payload) => {
        setItems((prev) =>
          prev.map((i) => i.id === payload.new.id ? { ...i, ...(payload.new as LiveFeedItem) } : i)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchFeed() {
    const { data } = await supabase
      .from('community_feed')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200)

    if (data) {
      const all = data as LiveFeedItem[]
      const top = all.filter((i) => !i.parent_id).reverse()
      const replies = all.filter((i) => i.parent_id)
      const withReplies = top.map((post) => ({
        ...post,
        replies: replies.filter((r) => r.parent_id === post.id),
      }))
      setItems(withReplies)
    }
    setLoading(false)
  }

  async function toggleLike(item: LiveFeedItem) {
    if (!user) return

    // Optimistic update first, then atomic RPC (no race condition on like_count)
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, likedByCurrentUser: !i.likedByCurrentUser, like_count: i.like_count + (i.likedByCurrentUser ? -1 : 1) }
          : i
      )
    )

    await supabase.rpc('toggle_like', { p_feed_item_id: item.id, p_subscriber_id: user.id })
  }

  async function addPost(text: string, imageFile?: File, dropNum?: number) {
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
      drop_num: dropNum ?? null,
    })

    await fetchFeed()
  }

  async function deletePost(item: LiveFeedItem) {
    await supabase.from('feed_items').delete().eq('id', item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  async function addComment(text: string, parentId: string) {
    if (!user || !profile) return
    await supabase.from('feed_items').insert({
      subscriber_id: user.id,
      type: 'comment',
      body: text,
      image_url: null,
      drop_num: null,
      parent_id: parentId,
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
        <FeedCard key={item.id} item={item} onLike={() => toggleLike(item)} onComment={(text) => addComment(text, item.id)} isOwn={!!user && item.subscriber_id === user.id} onDelete={() => deletePost(item)} />
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
    <div className="pr-2 pb-2">
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

      {/* Prizes */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([
          { rank: '#1', emoji: '🧱', prize: 'LEGO rinkinys', sub: 'Tavo pasirinkimas' },
          { rank: '#2', emoji: '🧥', prize: 'BRICKTIME džemperis', sub: 'Mūsų kolekcija' },
          { rank: '#3', emoji: '🎟', prize: '€20 čekis', sub: 'BRICKTIME eshop' },
        ] as const).map(({ rank, emoji, prize, sub }) => (
          <div key={rank} className="rounded-xl border-2 border-ink/10 bg-ink/[.03] px-2 py-2.5 flex flex-col items-center text-center gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink/30">{rank}</span>
            <span className="text-[18px] leading-none mt-0.5">{emoji}</span>
            <p className="font-bold text-[10px] text-ink leading-tight mt-1">{prize}</p>
            <p className="font-mono text-[8px] uppercase tracking-wider text-ink/40">{sub}</p>
          </div>
        ))}
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
            <div >
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

      <section className="bg-paper pt-6 pb-4">
        <div ref={heroRef} className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="rounded-2xl md:rounded-3xl border-2 border-ink bg-ink overflow-hidden p-6 md:p-10">
            <h1 className="heading-display text-d-xl tracking-[-0.02em] mt-3 text-paper">Bendruomenė.</h1>
            <p className="mt-5 font-mono text-[15px] text-paper/50 tracking-[.04em]">Žaisk. Statyk. Dalinkis.</p>
          </div>
        </div>
      </section>

      <section className="bg-paper pt-4 pb-20">
        <div ref={contentRef} className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[40%_60%]">

            <div className="md:sticky md:self-start md:max-h-[calc(100dvh-120px)] md:overflow-y-auto" style={{ top: '120px' }}>
              <h3 className="text-xl font-bold text-ink mb-6">Lyderiai</h3>
              <LeaderboardPanel />
            </div>

            <div >
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
