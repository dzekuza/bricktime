import gsap from 'gsap'
import { useReveal } from '@/hooks/useReveal'

const features = [
  {
    num: '01',
    title: '200–400 premium ABS bricks',
    body: 'Strict tolerance, brilliant colorways, fully compatible with the bricks you already own.',
    bg: '#4DA2FF',
  },
  {
    num: '02',
    title: '1–2 exclusive minifigs',
    body: 'Designed by guest artists. Numbered, never re-released, tradeable inside the club.',
    bg: '#FFAEE7',
  },
  {
    num: '03',
    title: 'Build card + sticker pack',
    body: 'Step-by-step on one side, lore on the other. Plus 16 vinyl stickers per drop.',
    bg: '#5DDB9C',
  },
  {
    num: '04',
    title: 'Slots into the universe',
    body: "Every drop connects. By month 12 you've built an entire street.",
    bg: '#FFD731',
  },
]

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.card-num'))
  gsap.to(e.currentTarget.querySelector('.card-num'), {
    rotate: 14, scale: 1.18, duration: 0.22, ease: 'back.out(2.5)',
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.card-num'))
  gsap.to(e.currentTarget.querySelector('.card-num'), {
    rotate: 0, scale: 1, duration: 0.32, ease: 'elastic.out(1, 0.55)',
  })
}

export default function WhatsInside() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-[1320px] px-7">
        <div ref={ref} className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">

          {/* Left — sticky headline (no reveal on sticky element — transform breaks position:sticky) */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="reveal">
            <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ What's inside</p>
            <h2
              className="mt-4 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(48px, 5vw, 84px)',
                lineHeight: '.88',
                letterSpacing: '-.015em',
              }}
            >
              A pack worth
              <br />
              <span
                className="inline-block border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transform: 'rotate(-1.5deg)' }}
              >
                tearing open
              </span>.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.65] text-ink/65">
              Every drop is built for builders, sized for the mailbox, and designed to connect — month after month.
            </p>
            <a
              href="#plans"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-7 py-3.5 font-bold text-[15px] text-paper transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#001B21]"
            >
              Start subscription →
            </a>

            {/* Lifestyle photo */}
            <div className="mt-8 overflow-hidden rounded-3xl border-2 border-ink shadow-[6px_6px_0_#001B21]" style={{ height: 260 }}>
              <img
                src="/images/build-cactus.jpg"
                alt="Builder placing the final piece on a BRICKTIME drop"
                className="h-full w-full object-cover"
                style={{ objectPosition: 'center 35%' }}
              />
            </div>
            </div>
          </div>

          {/* Right — scrollable stacked cards */}
          <div className="reveal flex flex-col gap-4">
            {features.map((f, i) => (
              <div
                key={f.num}
                className="flex gap-6 rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21]"
                style={{ background: f.bg, transitionDelay: `${i * 60}ms` }}
                onMouseEnter={onCardEnter}
                onMouseLeave={onCardLeave}
              >
                <div
                  className="card-num shrink-0 select-none leading-none text-ink/20"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: .85 }}
                >
                  {f.num}
                </div>
                <div className="pt-1">
                  <h3
                    className="uppercase text-ink"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(20px, 1.8vw, 28px)',
                      lineHeight: '.92',
                      letterSpacing: '-.01em',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.65] text-ink/65">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
