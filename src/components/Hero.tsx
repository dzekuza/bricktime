import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'

const avatarColors = ['#5DDB9C', '#FFAEE7', '#FB4903', '#4DA2FF']

export default function Hero() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1320px] px-7 py-20">
        {/* Bento: 12-col — [main copy col-7 row-2] [countdown col-5] [bag col-5] */}
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Tile A — main copy (col-span-7, row-span-2) */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_#001B21] lg:col-span-7 lg:row-span-2"
            style={{ background: '#001B21', minHeight: 520 }}
          >
            <div>
              <Badge
                variant="outline"
                className="w-fit rounded-full border-2 border-paper/40 bg-transparent px-4 py-1.5 font-mono text-[11px] tracking-[.16em] uppercase text-paper"
              >
                <span className="mr-2 inline-block size-2 rounded-full bg-brand-mint" />
                Drop № 26 — May 2026 ships in 12 days
              </Badge>
              <h1
                className="mt-7 uppercase text-paper"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(44px, 4.5vw, 82px)',
                  lineHeight: '.88',
                  letterSpacing: '-.015em',
                }}
              >
                Expand your{' '}
                <span
                  className="inline-block border-[3px] border-paper/40 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.2)]"
                  style={{ transform: 'rotate(-1.5deg)' }}
                >
                  brick
                </span>
                <br />
                <span className="inline-block" style={{ fontStyle: 'italic', transform: 'skew(-8deg)' }}>
                  collection
                </span>
                <br />
                in a smarter way.
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-paper/75">
                A monthly mailbox-friendly pack of premium bricks, exclusive minifigs, and a build card.
                Cancel, swap, or skip any month — bricks are forever.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full border-2 border-paper/40 bg-brand-yellow text-ink font-bold text-[16px] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(245,241,235,.3)] transition-all"
              >
                <a href="#plans">Start subscription →</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-2 border-paper/40 bg-transparent text-paper text-[16px] font-bold hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(245,241,235,.2)] transition-all"
              >
                <a href="/archive">See past drops</a>
              </Button>
            </div>
          </div>

          {/* Tile B — countdown (col-span-5, row 1) */}
          <div
            className="reveal flex flex-col items-center justify-center rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] text-center text-paper lg:col-span-5"
            style={{ background: '#FB4903', minHeight: 240 }}
          >
            <div className="font-mono text-[10px] tracking-[.28em] uppercase text-paper/70 mb-2">
              Next drop in
            </div>
            <div
              className="text-paper"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(72px, 7vw, 112px)',
                lineHeight: '.82',
                letterSpacing: '-.02em',
              }}
            >
              12
              <br />
              DAYS
            </div>
            <div className="mt-3 font-mono text-[11px] tracking-[.18em] uppercase text-paper/75">
              May 2026 · Drop № 26
            </div>
          </div>

          {/* Tile C — bag + social proof (col-span-5, row 2) */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] lg:col-span-5 relative overflow-hidden"
            style={{
              background: '#4DA2FF',
              backgroundImage:
                'radial-gradient(circle at 14px 14px, rgba(255,255,255,.18) 3px, transparent 4px)',
              backgroundSize: '34px 34px',
              minHeight: 240,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="h-[12px] w-[56px] rounded bg-ink mb-1.5" />
                <div className="h-[8px] w-[38px] rounded bg-ink/30" />
              </div>
              <span className="font-mono text-[9px] tracking-[.14em] uppercase text-paper">
                № 26 · 280 pcs
              </span>
            </div>

            <div>
              <h3
                className="uppercase text-paper"
                style={{ fontFamily: 'var(--font-display)', fontSize: 60, lineHeight: '.85' }}
              >
                BRICK
                <br />
                TIME
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex">
                {avatarColors.map((color, i) => (
                  <span
                    key={i}
                    className="size-[30px] rounded-full border-2 border-ink"
                    style={{ background: color, marginLeft: i === 0 ? 0 : -8 }}
                  />
                ))}
              </div>
              <div className="text-[13px] text-paper">
                <div className="font-bold">★★★★★ 4.9</div>
                <div className="opacity-75 text-[11px]">12,400+ builders</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
