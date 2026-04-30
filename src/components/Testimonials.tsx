import gsap from 'gsap'
import { StarIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useReveal } from '@/hooks/useReveal'

const testimonials = [
  {
    quote: '"Mano stalas virto mažu miestu. Produktas-26 pašto surinkimas — tai beprotybė."',
    name: 'Amelia R.',
    meta: 'Prenumeratorė nuo produkto 04',
    avatarColor: '#FB4903',
    initials: 'AR',
    bg: '#5DDB9C',
    textColor: '#001B21',
    colSpan: 'lg:col-span-7',
    big: true,
  },
  {
    quote: '"Mano vaikai mano, kad esu burtininkas. Surinkimo kortelės tiesiog nuostabios."',
    name: 'Marco T.',
    meta: 'Mega lygis · 14 mėnesių',
    avatarColor: '#FFAEE7',
    initials: 'MT',
    bg: '#F5F1EB',
    textColor: '#001B21',
    colSpan: 'lg:col-span-5',
    big: false,
  },
  {
    quote: '"Praleidau mėnesį, jokios dramos. Grįžau į koralinio rifo produktą. Tobula."',
    name: 'Yuki S.',
    meta: 'Standard lygis',
    avatarColor: '#5DDB9C',
    initials: 'YS',
    bg: '#FFAEE7',
    textColor: '#001B21',
    colSpan: 'lg:col-span-7',
    big: false,
  },
]

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.stars'))
  gsap.to(e.currentTarget.querySelector('.stars'), {
    scale: 1.3, y: -4, duration: 0.2, ease: 'back.out(2.5)',
  })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.killTweensOf(e.currentTarget.querySelector('.stars'))
  gsap.to(e.currentTarget.querySelector('.stars'), {
    scale: 1, y: 0, duration: 0.3, ease: 'elastic.out(1, 0.55)',
  })
}

export default function Testimonials() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-paper py-10 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Quote 1 — big tile (col-span-7) */}
          <div
            className={[
              'reveal flex flex-col justify-between brick-card brick-card-hover p-6 md:p-9 min-h-[280px]',
              testimonials[0].colSpan,
            ].join(' ')}
            style={{ background: testimonials[0].bg }}
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
          >
            <div className="stars flex gap-0.5 text-ink">
              {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="size-4 fill-current" />)}
            </div>
            <p className="mt-4 uppercase text-ink heading-display text-d-xs leading-[1.05]">
              {testimonials[0].quote}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar className="size-[42px] border-2 border-ink">
                <AvatarFallback
                  style={{ background: testimonials[0].avatarColor }}
                  className="text-[13px] font-bold text-ink"
                >
                  {testimonials[0].initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <b className="text-[15px] text-ink">{testimonials[0].name}</b>
                <small className="mt-0.5 block font-mono text-[11px] tracking-[.12em] uppercase text-ink/55">
                  {testimonials[0].meta}
                </small>
              </div>
            </div>
          </div>

          {/* Quote 2 — col-span-5 */}
          <div
            className={[
              'reveal flex flex-col justify-between brick-card brick-card-hover p-6 md:p-8 min-h-[280px]',
              testimonials[1].colSpan,
            ].join(' ')}
            style={{ background: testimonials[1].bg, transitionDelay: '100ms' }}
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
          >
            <div className="stars flex gap-0.5 text-ink">{Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="size-4 fill-current" />)}</div>
            <p className="mt-4 uppercase text-ink heading-display text-d-xs leading-[1.05]">
              {testimonials[1].quote}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar className="size-[38px] border-2 border-ink">
                <AvatarFallback
                  style={{ background: testimonials[1].avatarColor }}
                  className="text-[12px] font-bold text-ink"
                >
                  {testimonials[1].initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <b className="text-[14px] text-ink">{testimonials[1].name}</b>
                <small className="mt-0.5 block font-mono text-[10px] tracking-[.12em] uppercase text-ink/55">
                  {testimonials[1].meta}
                </small>
              </div>
            </div>
          </div>

          {/* Header tile — col-span-5, row 2 */}
          <div
            className="reveal flex flex-col justify-center rounded-2xl md:rounded-3xl border-2 border-ink p-6 md:p-9 shadow-[6px_6px_0_rgba(245,241,235,.12)] lg:col-span-5 min-h-[220px]"
            style={{ background: '#001B21', transitionDelay: '80ms' }}
          >
            <p className="label-mono text-paper/50">⬢ Prenumeratoriai</p>
            <h2 className="mt-3 heading-display text-d-lg text-paper">
              <span
                className="inline-block border-[3px] border-paper/40 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.2)]"
                style={{ transform: 'rotate(-1.5deg)' }}
              >
                12 400
              </span>
              <br />
              kūrėjų
              <br />
              prisijungę.
            </h2>
          </div>

          {/* Quote 3 — col-span-7, row 2 */}
          <div
            className={[
              'reveal flex flex-col justify-between brick-card brick-card-hover p-6 md:p-8 min-h-[220px]',
              testimonials[2].colSpan,
            ].join(' ')}
            style={{ background: testimonials[2].bg, transitionDelay: '160ms' }}
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
          >
            <div className="stars flex gap-0.5 text-ink">{Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="size-4 fill-current" />)}</div>
            <p className="mt-4 uppercase text-ink heading-display text-d-xs leading-[1.05]">
              {testimonials[2].quote}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar className="size-[38px] border-2 border-ink">
                <AvatarFallback
                  style={{ background: testimonials[2].avatarColor }}
                  className="text-[12px] font-bold text-ink"
                >
                  {testimonials[2].initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <b className="text-[14px] text-ink">{testimonials[2].name}</b>
                <small className="mt-0.5 block font-mono text-[10px] tracking-[.12em] uppercase text-ink/55">
                  {testimonials[2].meta}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
