import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StarIcon } from 'lucide-react'

// ── Countdown ──────────────────────────────────────────────────────────────
function useCountdown(targetDays: number) {
  const [time, setTime] = useState({ days: targetDays, hrs: 4, min: 38, sec: 0 })
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { days, hrs, min, sec } = t
        sec--; if (sec < 0) { sec = 59; min-- }
        if (min < 0) { min = 59; hrs-- }
        if (hrs < 0) { hrs = 23; days-- }
        return { days: Math.max(0, days), hrs: Math.max(0, hrs), min: Math.max(0, min), sec: Math.max(0, sec) }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── sub-components ─────────────────────────────────────────────────────────
function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[56px] flex-col items-center rounded-[10px] border-2 border-paper bg-paper px-3 py-2 text-ink">
      <span className="font-display text-3xl leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <small className="mt-0.5 font-mono text-[9px] tracking-[.16em] uppercase text-ink/55">{label}</small>
    </div>
  )
}

const bagContents = [
  { num: '01', label: 'Foundation\n+ Mailbox', desc: '62 bricks. Working pull-down mailbox door, brass hinge piece, and the building\'s address tile (№ 26).', bg: '#5DDB9C' },
  { num: '02', label: 'Floors\n1 – 3', desc: '114 bricks. Three storeys with planted balconies, a pigeon, and a window cat.', bg: '#FFAEE7' },
  { num: '03', label: 'Floors\n4 – 5 + roof', desc: '96 bricks. Skylight, antenna, drying laundry on a printed banner piece.', bg: '#FFD731' },
  { num: '04', label: 'Otto\n+ Mrs. Petrov', desc: '40 bricks. The two minifigs, Otto\'s satchel, a folding bicycle, and 18 vinyl stickers.', bg: '#4DA2FF' },
]

const compatibility = [
  { drop: 'PRODUKTAS № 14 — JUL 2025', title: 'Otto\'s bus', desc: 'The bus depot from product 14 docks against Mailbox Row\'s east wall using the same brass hinge.', bg: '#5DDB9C' },
  { drop: 'PRODUKTAS № 09 — FEB 2025', title: 'Bakery corner', desc: 'Place the bakery to the north — the awning lines up with Mailbox Row\'s ground-floor entrance.', bg: '#FFAEE7' },
  { drop: 'PRODUKTAS № 21 — DEC 2025', title: 'Lighthouse', desc: 'Optional: route Otto\'s bike past the lighthouse using the path tiles included in this product\'s bag 4.', bg: '#FFD731' },
]

const reviews = [
  { stars: 5, quote: '"The hinge crossover with the bus is genuinely clever. My street has a postal route now."', name: 'Daniel K.', meta: 'Mega · Subscriber since product 02', avatarColor: '#FB4903', initials: 'DK' },
  { stars: 5, quote: '"Otto\'s satchel actually flexes. I can\'t explain how delightful that is until you hold it."', name: 'Priya N.', meta: 'Standard · 11 months', avatarColor: '#5DDB9C', initials: 'PN' },
  { stars: 5, quote: '"Finished it in one evening. The mint+cream colour pairing is the best of the year."', name: 'Lucia F.', meta: 'Standard · 6 months', avatarColor: '#FFAEE7', initials: 'LF' },
  { stars: 4, quote: '"Build is great. Sticker sheet is generous. Wish there was a third minifig — that\'s my one nit."', name: 'Theo W.', meta: 'Mega · 22 months', avatarColor: '#4DA2FF', initials: 'TW' },
]

// Drop 26 requires Standard tier or above

const tiers = [
  { name: 'Nano',     price: 9,  annualPrice: 7,  spec: '60–90 bricks',    bg: '#F5F1EB', textColor: '#001B21' },
  { name: 'Mini',     price: 14, annualPrice: 11, spec: '120–180 bricks',  bg: '#FFAEE7', textColor: '#001B21' },
  { name: 'Standard', price: 24, annualPrice: 19, spec: '240–320 bricks',  bg: '#FFD731', textColor: '#001B21' },
  { name: 'Pro',      price: 35, annualPrice: 28, spec: '340–400 bricks',  bg: '#4DA2FF', textColor: '#001B21' },
  { name: 'Mega',     price: 55, annualPrice: 44, spec: '420–520 bricks',  bg: '#FB4903', textColor: '#F5F1EB' },
]

type FaqItem = { q: string; a: string }

type DbProduct = {
  id: number
  title: string
  subtitle: string
  description: string | null
  category: string
  bricks: number
  minifigs: string
  build_time: string | null
  image_url: string | null
  gallery: string[]
  tier: string
  faq: FaqItem[] | null
  release_date: string | null
}

const LT_MONTHS = ['Sausis','Vasaris','Kovas','Balandis','Gegužė','Birželis','Liepa','Rugpjūtis','Rugsėjis','Spalis','Lapkritis','Gruodis']

function formatReleaseDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${LT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const THUMB_BG = ['#5C4ADE', '#5DDB9C', '#FFAEE7', '#FFD731']

// ── page ───────────────────────────────────────────────────────────────────
export default function Drop() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<DbProduct | null>(null)
  const [activeThumb, setActiveThumb] = useState(0)

  useEffect(() => {
    if (!id) return
    supabase
      .from('products')
      .select('id, title, subtitle, description, category, bricks, minifigs, build_time, image_url, gallery, tier, faq, release_date')
      .eq('id', Number(id))
      .single()
      .then(({ data }) => { if (data) setProduct(data as unknown as DbProduct) })
  }, [id])

  const dropRequiredTierIdx = tiers.findIndex((t) => t.name.toLowerCase() === (product?.tier ?? 'standard'))
  const DROP_REQUIRED_TIER = dropRequiredTierIdx === -1 ? 2 : dropRequiredTierIdx

  const galleryImages: string[] = product
    ? [product.image_url, ...(product.gallery ?? [])].filter(Boolean) as string[]
    : []

  const thumbs = galleryImages.length > 0
    ? galleryImages.map((image, i) => ({ label: `[ View ${i + 1} ]`, bg: THUMB_BG[i % THUMB_BG.length], image }))
    : [
        { label: '[ Front ]',        bg: '#5C4ADE', image: '/images/build-castle.jpg' },
        { label: '[ Detail ]',       bg: '#5DDB9C', image: '/images/build-cactus.jpg' },
        { label: '[ Build spread ]', bg: '#FFAEE7', image: '/images/build-sailboat.jpg' },
        { label: '[ Scale view ]',   bg: '#FFD731', image: '/images/build-spaceship.jpg' },
      ]

  return (
    <>
      <Nav />

      {/* ── Product Hero ── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2.5 font-mono text-[11px] tracking-[.18em] uppercase text-ink/55">
            <Link to="/" className="hover:text-ink transition-colors">BRICKTIME</Link>
            <span className="text-ink/30">/</span>
            <Link to="/archive" className="hover:text-ink transition-colors">Products</Link>
            <span className="text-ink/30">/</span>
            <span className="font-bold text-ink">Product №{product?.id} — {product?.title}</span>
          </div>

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            {/* Gallery tile */}
            <div className="brick-card p-4">
              <div className="flex flex-col gap-4">
                {/* Main image */}
                <div
                  className="relative h-[520px] overflow-hidden rounded-[24px] border-2 border-ink"
                  style={{ background: thumbs[activeThumb].bg }}
                >
                  <img
                    key={activeThumb}
                    src={thumbs[activeThumb].image}
                    alt={thumbs[activeThumb].label}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                    style={{ objectPosition: 'center 20%' }}
                  />
                  {/* Overlay badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                  {product?.release_date && (
                    <div
                      className="absolute left-6 top-6 font-display text-2xl leading-none rounded-[8px] border-2 border-ink bg-brand-yellow px-4 py-2.5 text-ink rotate-[-3deg]"
                      style={{ boxShadow: '4px 4px 0 #001B21' }}
                    >
                      {formatReleaseDate(product.release_date)}
                    </div>
                  )}
                  <div
                    className="absolute right-6 top-6 font-display text-2xl leading-none rounded-[8px] border-2 border-ink bg-brand-orange px-4 py-2.5 text-paper"
                    style={{ transform: 'rotate(3deg)', boxShadow: '4px 4px 0 #001B21' }}
                  >
                    Product № {product?.id}
                  </div>
                  <div className="absolute bottom-5 left-6 font-mono text-[10px] tracking-[.18em] uppercase text-paper/70">
                    {thumbs[activeThumb].label}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-3">
                  {thumbs.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveThumb(i)}
                      className={[
                        'relative h-[90px] overflow-hidden rounded-lg border-2 border-ink transition-all',
                        activeThumb === i ? 'outline outline-[3px] outline-offset-2 outline-brand-yellow' : 'hover:opacity-80',
                      ].join(' ')}
                      style={{ background: t.bg }}
                    >
                      <img src={t.image} alt={t.label} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center 20%' }} />
                      <div className="absolute inset-0 bg-ink/30" />
                      <span className="absolute bottom-1.5 left-0 right-0 text-center font-mono text-[8px] tracking-[.12em] uppercase text-paper/80">
                        {t.label.replace(/\[|\]/g, '').trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Details tile */}
            <div className="brick-card p-6 md:p-8 bg-paper" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,.06)' }}>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="font-display text-2xl leading-none rounded-[8px] bg-ink px-3.5 py-2 text-paper"
                  style={{ letterSpacing: '.04em' }}
                >
                  № {product?.id}
                </span>
                {product?.release_date && (
                  <Badge className="rounded-full border-2 border-ink bg-brand-mint px-3 py-1 text-ink font-semibold">
                    <span className="mr-1.5 inline-block size-2 rounded-full bg-ink" />
                    {formatReleaseDate(product.release_date)}
                  </Badge>
                )}
                {product?.category && (
                  <Badge variant="outline" className="rounded-full border-2 border-ink px-3 py-1 text-ink font-semibold">
                    {product.category}
                  </Badge>
                )}
              </div>

              <h1 className="heading-display text-d-lg tracking-[-0.01em] mt-3.5 text-ink">
                {product?.title ?? 'Mailbox Row'}<br />+{' '}
                <span className="inline-block italic text-brand-indigo" style={{ transform: 'skew(-8deg)' }}>
                  {product?.subtitle ?? 'Postman Otto'}
                </span>
              </h1>

              <p className="mt-6 max-w-[48ch] text-[18px] leading-[1.62] text-ink/80">
                {product?.description ?? 'A five-storey postwar apartment block in mint and cream, complete with a working mailbox door, three planted balconies, and the universe\'s first scheduled crossover — Otto\'s bus is the bus from product №14.'}
              </p>

              {/* Spec grid */}
              <div className="mt-8 overflow-hidden rounded-2xl md:rounded-3xl border-2 border-ink">
                <div className="grid grid-cols-3">
                  {[
                    [String(product?.bricks ?? 312), 'Bricks'],
                    [product?.build_time ?? '—', 'Build time'],
                    [product?.tier ? (product.tier.charAt(0).toUpperCase() + product.tier.slice(1)) : 'Standard', 'Min. plan'],
                  ].map(([val, label], i) => (
                    <div key={i} className={`flex flex-col gap-1 bg-paper p-4 ${i < 2 ? 'border-r-[1.5px] border-ink' : ''}`} style={{ borderStyle: 'solid', borderColor: '#001B21' }}>
                      <b className="font-display text-[36px] leading-none">{val}</b>
                      <small className="font-mono text-[10px] tracking-[.16em] uppercase text-ink/55">{label}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rent box */}
              <div id="buy" className="mt-8 brick-card bg-ink p-6 md:p-7 text-paper">
                {/* Required plan */}
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="rounded-full border-2 border-ink px-4 py-2 font-display text-[18px] leading-none"
                    style={{ background: tiers[DROP_REQUIRED_TIER].bg, color: tiers[DROP_REQUIRED_TIER].textColor }}
                  >
                    {tiers[DROP_REQUIRED_TIER].name}+
                  </div>
                  <span className="text-[14px] text-paper/60">reikalingas planas</span>
                </div>

                <p className="mt-4 text-[14px] leading-[1.6] text-paper/60">
                  Šis produktas įskaičiuotas į tavo prenumeratą — jokio papildomo mokesčio. Tiesiog nuomoki, sustatyk ir grąžink.
                </p>

                <Button
                  asChild
                  size="lg"
                  className="mt-6 w-full justify-center rounded-full border-2 border-brand-yellow bg-brand-yellow text-ink text-[16px] font-bold hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(245,241,235,.25)] transition-all"
                >
                  <Link to={`/checkout?product=${product?.id}`}>
                    Nuomoti nemokamai →
                  </Link>
                </Button>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] tracking-[.16em] uppercase text-paper/50">
                  {['Nemokamas pristatymas', 'Atšauk bet kada', '30 d. garantija'].map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-brand-mint shadow-[0_0_0_2px_rgba(245,241,235,.5)]" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-center font-mono text-[11px] tracking-[.16em] uppercase text-ink/55">
                Already a subscriber? Product №{product?.id} is included in your box.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's in the bag ── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Row 1: Header tile */}
            <div className="flex flex-col justify-center brick-card bg-paper p-6 md:p-8 lg:col-span-5">
              <h3 className="label-mono text-ink/50">⬢ What's in the bag</h3>
              <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.01em] mt-3 text-ink">
                Four parts.<br />One mailbox row.
              </h2>
              <p className="mt-5 max-w-[40ch] text-[16px] leading-[1.65] text-ink/65">
                Tear the seal, scan the QR, and you'll find these four bagged sub-builds — each one a self-contained section of the model.
              </p>
            </div>

            {/* Row 1: Bag 04 — sky wide tile */}
            <div
              className="relative flex flex-col justify-end brick-card brick-card-hover p-6 md:p-8 lg:col-span-7 min-h-[280px]"
              style={{ background: bagContents[3].bg }}
            >
              <Badge className="absolute right-6 top-6 rounded-full border-[1.5px] border-ink bg-paper px-2.5 py-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink">
                Bag {bagContents[3].num}
              </Badge>
              <div className="absolute left-8 top-6 font-display text-[110px] leading-none select-none text-ink/15">
                {bagContents[3].num}
              </div>
              <h4 className="font-display text-[36px] leading-[.95] uppercase text-ink">
                {bagContents[3].label.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
              </h4>
              <p className="mt-2 max-w-[40ch] text-[14px] leading-[1.5] text-ink/75">{bagContents[3].desc}</p>
            </div>

            {/* Row 2: Bags 01, 02, 03 */}
            {bagContents.slice(0, 3).map((bag) => (
              <div
                key={bag.num}
                className="relative flex flex-col justify-end brick-card brick-card-hover p-6 md:p-7 lg:col-span-4 min-h-[260px]"
                style={{ background: bag.bg }}
              >
                <Badge className="absolute right-5 top-5 rounded-full border-[1.5px] border-ink bg-paper px-2.5 py-1 font-mono text-[10px] tracking-[.14em] uppercase text-ink">
                  Bag {bag.num}
                </Badge>
                <div className="absolute left-7 top-5 font-display text-[88px] leading-none select-none text-ink/15">
                  {bag.num}
                </div>
                <h4 className="font-display text-[28px] leading-[.95] uppercase text-ink">
                  {bag.label.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                </h4>
                <p className="mt-2 text-[13px] leading-[1.5] text-ink/75">{bag.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Art panel tile */}
            <div
              className="relative overflow-hidden brick-card lg:col-span-5 min-h-[480px]"
              style={{
                background: '#FB4903',
                backgroundImage: 'radial-gradient(circle at 18px 18px, rgba(255,255,255,.14) 5px, transparent 6px)',
                backgroundSize: '48px 48px',
              }}
            >
              <div className="absolute inset-10 grid place-items-center rounded-xl border-2 border-dashed border-paper/35 text-center font-mono text-[11px] tracking-[.18em] uppercase text-paper/55">
                Editorial photo<br />Otto sketch + photo of finished build on a desk
              </div>
            </div>

            {/* Story text tile */}
            <div className="flex flex-col justify-center brick-card bg-paper p-10 lg:col-span-7">
              <h3 className="label-mono text-ink/50">⬢ The story</h3>
              <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.01em] mt-3 text-ink">
                Otto has been<br />delivering mail<br />since product 14.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.6] text-ink/80">
                You may have spotted Otto first as the bus driver in our spring-2025 transit product. He's been quietly background-fielding bus routes ever since — but in May 2026 we're giving him his own building.
              </p>
              <p className="mt-3.5 text-[17px] leading-[1.6] text-ink/80">
                Mailbox Row is the first BRICKTIME product with a designed crossover: the fixed brass hinge under the mailbox is the same pin used in Otto's bus from product 14. Slot them together, and the whole street starts to make sense.
              </p>
              <div className="mt-8 flex items-center gap-4 border-t border-dashed border-ink/20 pt-6">
                <Avatar className="size-[54px] border-2 border-ink">
                  <AvatarFallback className="bg-brand-mint text-ink font-bold">MP</AvatarFallback>
                </Avatar>
                <div>
                  <b className="text-[15px]">Designed by Marek Polčák</b>
                  <small className="mt-0.5 block font-mono text-[11px] tracking-[.14em] uppercase text-ink/55">Senior brick designer · Vilnius studio</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Minifig ── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Header tile */}
            <div className="flex flex-col justify-center brick-card bg-paper p-6 md:p-8 lg:col-span-5">
              <h3 className="label-mono text-ink/50">⬢ Exclusive minifigs</h3>
              <h2 className="heading-display text-d-xl leading-[.9] tracking-[-0.01em] mt-3 text-ink">
                Two new<br />residents.
              </h2>
              <p className="mt-5 max-w-[38ch] text-[16px] leading-[1.65] text-ink/75">
                Numbered, never re-released, tradeable inside the BRICKTIME club. Otto comes with his satchel; Mrs. Petrov with a watering can and a tabby cat.
              </p>
            </div>

            {/* Figcard tile */}
            <div
              className="relative grid place-items-center overflow-hidden rounded-2xl md:rounded-3xl border-2 bg-ink p-12 shadow-[6px_6px_0_#001B21] lg:col-span-7 min-h-[480px]"
              style={{
                borderColor: 'rgba(245,241,235,.2)',
                backgroundImage: 'linear-gradient(transparent 31px, rgba(245,241,235,.08) 32px), linear-gradient(90deg, transparent 31px, rgba(245,241,235,.08) 32px)',
                backgroundSize: '32px 32px',
              }}
            >
              <div className="absolute left-6 top-6 font-mono text-[11px] tracking-[.18em] uppercase text-paper/70">
                № 26 / 1<br /><b className="text-brand-yellow">3,500 PRESSED</b>
              </div>
              <div className="absolute right-6 top-6 grid size-16 place-items-center rounded-full border-2 border-paper text-center font-mono text-[11px] text-ink"
                style={{ background: 'linear-gradient(135deg,#FFAEE7,#FFD731,#5DDB9C,#4DA2FF)', lineHeight: '.95' }}>
                EXCL.<br />MINIFIG
              </div>
              {/* Generic mail character — NOT a LEGO recreation */}
              <div className="relative" style={{ width: 160, height: 240 }}>
                <div className="absolute rounded-t-[8px] border-[3px] border-paper bg-brand-sky" style={{ left: 32, top: 0, width: 96, height: 36 }} />
                <div className="absolute rounded border-[3px] border-paper bg-ink" style={{ left: 20, top: 32, width: 120, height: 10 }} />
                <div className="absolute rounded-[10px] border-[3px] border-paper bg-brand-yellow" style={{ left: 40, top: 42, width: 80, height: 62 }} />
                <div className="absolute size-2.5 rounded-full border-[3px] border-paper bg-paper" style={{ top: 64, left: 60 }} />
                <div className="absolute size-2.5 rounded-full border-[3px] border-paper bg-paper" style={{ top: 64, left: 88 }} />
                <div className="absolute rounded-b-[36px] border-[3px] border-t-0 border-paper" style={{ left: 62, top: 82, width: 36, height: 14 }} />
                <div className="absolute rounded-[8px] border-[3px] border-paper bg-brand-sky" style={{ left: 34, top: 106, width: 92, height: 80 }} />
                <div className="absolute grid place-items-center rounded border-[3px] border-ink bg-paper font-display text-[14px] text-ink" style={{ left: 60, top: 128, width: 40, height: 24 }}>P</div>
                <div className="absolute rounded-[6px] border-[3px] border-paper bg-ink" style={{ left: 44, top: 186, width: 36, height: 54 }} />
                <div className="absolute rounded-[6px] border-[3px] border-paper bg-ink" style={{ left: 80, top: 186, width: 36, height: 54 }} />
              </div>
              <div className="absolute bottom-6 left-6 font-display text-3xl leading-[.95] uppercase text-paper">
                <small className="mb-1.5 block font-mono text-[10px] tracking-[.16em] uppercase text-paper/60">Designed by guest artist Hanae Mori</small>
                Postman Otto
              </div>
            </div>

            {/* Kit list tile — full width second row */}
            <div className="brick-card bg-paper p-6 md:p-8 lg:col-span-12">
              <h3 className="label-mono text-ink/50">⬢ Otto's kit</h3>
              <h3 className="heading-display text-d-md leading-[.9] tracking-[-0.01em] mt-3 text-ink">
                Mail satchel, folding bike, printed lanyard.
              </h3>
              <ul className="mt-8 grid grid-cols-1 gap-[18px] md:grid-cols-3">
                {[
                  { title: 'Removable satchel piece', body: "First time we've used the new fabric-look ABS — the satchel actually flexes when Otto sits down." },
                  { title: 'Folding bicycle (8 pieces)', body: "Designed to fit on the bus from product 14. Otto can ride to work, or take the bus, or both." },
                  { title: 'Hand-numbered base plate', body: "Each base is laser-numbered 1/3,500 to 3,500/3,500. Yours arrives with a random number, registered on the BRICKTIME ledger." },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3.5">
                    <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-full bg-ink font-bold text-paper text-sm">✓</span>
                    <div>
                      <b className="block text-[17px]">{item.title}</b>
                      <span className="mt-1 block text-[14px] leading-[1.5] text-ink/70">{item.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compatibility ── */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Row 1: Header label tile */}
            <div
              className="flex flex-col justify-center rounded-2xl md:rounded-3xl border-2 p-6 md:p-8 shadow-[6px_6px_0_rgba(245,241,235,.15)] lg:col-span-5"
              style={{ borderColor: 'rgba(245,241,235,.2)', background: 'rgba(245,241,235,.05)' }}
            >
              <h3 className="label-mono text-paper/50">⬢ Universe map</h3>
              <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.01em] mt-3 text-paper">
                Slots into three<br />existing products.
              </h2>
            </div>

            {/* Row 1: Tagline tile */}
            <div
              className="flex flex-col justify-center rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-8 shadow-[6px_6px_0_rgba(245,241,235,.15)] lg:col-span-7"
              style={{ background: '#FFD731' }}
            >
              <p className="max-w-[44ch] text-[20px] leading-[1.55] text-ink font-medium">
                Every BRICKTIME product is part of one growing universe. Mailbox Row connects directly with these previous products via shared pins, scale, and color set.
              </p>
            </div>

            {/* Row 2: 3 compat cards */}
            {compatibility.map((c) => (
              <div
                key={c.drop}
                className="flex flex-col gap-3.5 rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-7 shadow-[6px_6px_0_rgba(245,241,235,.15)] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_rgba(245,241,235,.15)] lg:col-span-4"
                style={{ background: c.bg, color: '#001B21' }}
              >
                <h3 className="label-mono text-ink/50">{c.drop}</h3>
                <h4 className="font-display text-[28px] leading-[.95] uppercase">{c.title}</h4>
                <p className="text-[14px] leading-[1.5] text-ink/70">{c.desc}</p>
                <div className="mt-auto h-[100px] rounded-xl border-2 border-dashed border-black/20 bg-black/5 grid place-items-center font-mono text-[10px] tracking-[.14em] uppercase text-black/40">
                  [ Connection diagram ]
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Row 1: Header tile */}
            <div className="flex flex-col justify-center brick-card bg-ink p-6 md:p-8 lg:col-span-5">
              <h3 className="label-mono text-paper/50">⬢ Early access</h3>
              <h2 className="heading-display text-d-lg leading-[.9] tracking-[-0.01em] mt-3 text-paper">
                From the<br />preview build.
              </h2>
            </div>

            {/* Row 1: Rating tile */}
            <div
              className="flex flex-col justify-center brick-card p-6 md:p-8 lg:col-span-7"
              style={{ background: '#FFD731' }}
            >
              <div className="font-display text-d-hero leading-none" style={{ color: '#001B21' }}>
                4.92<span style={{ fontSize: '40%', opacity: .5 }}>/5</span>
              </div>
              <small className="mt-2 font-mono text-[12px] tracking-[.16em] uppercase text-ink/70">Based on 86 Mega-tier preview reviews</small>
            </div>

            {/* Row 2+: 4 review cards, 2 per row */}
            {reviews.map((r, i) => (
              <Card
                key={i}
                className="flex flex-col gap-3.5 brick-card brick-card-hover bg-paper p-3 md:p-6 lg:col-span-6"
              >
                <CardContent className="flex flex-col gap-3.5 p-0">
                  <div className="flex gap-0.5" style={{ color: '#FB4903' }}>{Array.from({ length: r.stars }).map((_, i) => <StarIcon key={i} className="size-4 fill-current" />)}</div>
                  <p className="font-display text-[22px] leading-[1.05] tracking-[.005em] uppercase">{r.quote}</p>
                  <div className="mt-auto flex items-center gap-2.5 border-t border-dashed border-ink/18 pt-3">
                    <Avatar className="size-9 border-2 border-ink">
                      <AvatarFallback style={{ background: r.avatarColor }} className="text-[12px] font-bold text-ink">{r.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <b className="text-[14px]">{r.name}</b>
                      <small className="mt-0.5 block font-mono text-[10px] tracking-[.14em] uppercase text-ink/55">{r.meta}</small>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          {(product?.faq ?? []).length > 0 && (
            <div className="mt-4">
              <div className="brick-card bg-ink p-6 md:p-8 mb-4">
                <h3 className="label-mono text-paper/50">⬢ Common questions</h3>
                <h2 className="heading-display text-d-md leading-[.9] tracking-[-0.01em] mt-3 text-paper">FAQ</h2>
              </div>
              <div className="flex flex-col gap-3">
                {(product?.faq ?? []).map((item, i) => (
                  <div key={i} className="brick-card bg-paper p-6 md:p-7">
                    <h4 className="font-display text-[22px] leading-[1] uppercase text-ink">{item.q}</h4>
                    <p className="mt-3 text-[16px] leading-[1.65] text-ink/75">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prev / Next */}
          <div className="mt-4 overflow-hidden rounded-2xl md:rounded-3xl border-2 border-ink">
            <div className="grid grid-cols-2">
              <Link to="/drop/25" className="flex flex-col gap-1.5 bg-paper p-6 md:p-8 transition-colors hover:bg-brand-yellow">
                <small className="font-mono text-[11px] tracking-[.16em] uppercase text-ink/55">← Previous · April 2026</small>
                <b className="font-display text-[32px] leading-[.95] uppercase">№ 25 — Greenhouse</b>
              </Link>
              <Link to="/drop/27" className="flex flex-col items-end gap-1.5 border-l-2 border-ink bg-paper p-6 md:p-8 text-right transition-colors hover:bg-brand-yellow">
                <small className="font-mono text-[11px] tracking-[.16em] uppercase text-ink/55">Next · June 2026 →</small>
                <b className="font-display text-[32px] leading-[.95] uppercase">№ 27 — TBA</b>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
