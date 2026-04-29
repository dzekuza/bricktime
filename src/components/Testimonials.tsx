import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useReveal } from '@/hooks/useReveal'

const testimonials = [
  {
    quote: '"My desk has become a tiny city. The drop-26 mailbox build is wild."',
    name: 'Amelia R.',
    meta: 'Subscriber since drop 04',
    avatarColor: '#FB4903',
    initials: 'AR',
    bg: '#5DDB9C',
    textColor: '#001B21',
    colSpan: 'lg:col-span-7',
    big: true,
  },
  {
    quote: '"My kids think I\'m a wizard now. The build cards are just very good."',
    name: 'Marco T.',
    meta: 'Mega tier · 14 months',
    avatarColor: '#FFAEE7',
    initials: 'MT',
    bg: '#F5F1EB',
    textColor: '#001B21',
    colSpan: 'lg:col-span-5',
    big: false,
  },
  {
    quote: '"Skipped a month, no drama. Came back to a coral-reef drop. Perfect."',
    name: 'Yuki S.',
    meta: 'Standard tier',
    avatarColor: '#5DDB9C',
    initials: 'YS',
    bg: '#FFAEE7',
    textColor: '#001B21',
    colSpan: 'lg:col-span-7',
    big: false,
  },
]

export default function Testimonials() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-[1320px] px-7">
        {/*
          Bento 12-col, 2 rows:
          [Quote1 col-7] [Quote2 col-5]
          [Header col-5] [Quote3 col-7]
        */}
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Quote 1 — big tile (col-span-7) */}
          <div
            className={[
              'reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21]',
              testimonials[0].colSpan,
            ].join(' ')}
            style={{ background: testimonials[0].bg, minHeight: 280 }}
          >
            <div className="text-ink tracking-[3px] text-lg">★★★★★</div>
            <p
              className="mt-4 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 2.5vw, 36px)',
                lineHeight: 1.05,
                letterSpacing: '-.01em',
              }}
            >
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
              'reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21]',
              testimonials[1].colSpan,
            ].join(' ')}
            style={{ background: testimonials[1].bg, transitionDelay: '100ms', minHeight: 280 }}
          >
            <div className="text-ink tracking-[3px]">★★★★★</div>
            <p
              className="mt-4 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 2vw, 28px)',
                lineHeight: 1.05,
                letterSpacing: '-.01em',
              }}
            >
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
            className="reveal flex flex-col justify-center rounded-3xl border-2 border-ink p-9 shadow-[6px_6px_0_rgba(245,241,235,.12)] lg:col-span-5"
            style={{ background: '#001B21', transitionDelay: '80ms', minHeight: 220 }}
          >
            <p className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/50">⬢ Subscribers</p>
            <h2
              className="mt-3 uppercase text-paper"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 3.5vw, 58px)',
                lineHeight: '.88',
                letterSpacing: '-.01em',
              }}
            >
              12,400
              <br />
              builders
              <br />
              onboard.
            </h2>
          </div>

          {/* Quote 3 — col-span-7, row 2 */}
          <div
            className={[
              'reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21]',
              testimonials[2].colSpan,
            ].join(' ')}
            style={{ background: testimonials[2].bg, transitionDelay: '160ms', minHeight: 220 }}
          >
            <div className="text-ink tracking-[3px]">★★★★★</div>
            <p
              className="mt-4 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 2vw, 30px)',
                lineHeight: 1.05,
                letterSpacing: '-.01em',
              }}
            >
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
