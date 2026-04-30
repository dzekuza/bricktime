import gsap from 'gsap'
import { useReveal } from '@/hooks/useReveal'

const steps = [
  {
    num: '01',
    title: 'Pasirink\nplaną',
    body: 'Mini, Standard ar Mega. Keisk lygį bet kada — vis daugiau ant lentynų.',
    bg: '#5DDB9C',
    bricks: ['#FB4903', '#001B21'],
  },
  {
    num: '02',
    title: 'Gauk\nmėnesio produktą',
    body: 'Teminė siunta atkeliauja pirmąjį antradienį. Atpakuok, nuskenuok QR, surink modelį.',
    bg: '#FFAEE7',
    bricks: ['#4DA2FF', '#F5F1EB'],
  },
  {
    num: '03',
    title: 'Statyk,\nkeisk, kartok',
    body: 'Kiekvienas produktas jungiasi į visatą. Keisk dubletus BRICKTIME klube.',
    bg: '#FFD731',
    bricks: ['#5C4ADE', '#FB4903'],
  },
]

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  const bricks = e.currentTarget.querySelectorAll('.brick-el')
  gsap.killTweensOf(bricks)
  gsap.to(bricks, { y: -7, rotate: (_i) => (_i === 0 ? -10 : 10), duration: 0.22, ease: 'back.out(2.5)', stagger: 0.05 })
}
function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  const bricks = e.currentTarget.querySelectorAll('.brick-el')
  gsap.killTweensOf(bricks)
  gsap.to(bricks, { y: 0, rotate: 0, duration: 0.35, ease: 'elastic.out(1, 0.5)', stagger: 0.04 })
}

function Brick({ color }: { color: string }) {
  return (
    <div
      className="brick-el relative rounded border-[3px] border-ink"
      style={{ width: 54, height: 38, background: color, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.18)' }}
    >
      <span
        className="absolute -top-[11px] left-[10px] size-[20px] rounded-full border-[3px] border-ink"
        style={{ background: color, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.18)' }}
      />
      <span
        className="absolute -top-[11px] right-[10px] size-[20px] rounded-full border-[3px] border-ink"
        style={{ background: color, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.18)' }}
      />
    </div>
  )
}

export default function HowItWorks() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-[1320px] px-7">
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Step 01 — big tile, spans 2 rows */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-5 lg:row-span-2"
            style={{ background: steps[0].bg, minHeight: 420 }}
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
          >
            <div>
              <div className="font-mono text-[10px] tracking-[.24em] uppercase text-ink/60 mb-1">Žingsnis</div>
              <div
                className="text-ink/10 select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(72px, 10vw, 130px)', lineHeight: .8 }}
              >
                {steps[0].num}
              </div>
              <h3
                className="mt-2 uppercase text-ink"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(38px, 3.5vw, 56px)',
                  lineHeight: '.88',
                  letterSpacing: '-.01em',
                }}
              >
                {steps[0].title.split('\n').map((l, j) => (
                  <span key={j}>
                    {l}
                    <br />
                  </span>
                ))}
              </h3>
              <p className="mt-4 max-w-[30ch] text-[16px] leading-[1.6] text-ink/75">{steps[0].body}</p>
            </div>
            <div className="mt-6 flex gap-2.5">
              {steps[0].bricks.map((c, i) => (
                <Brick key={i} color={c} />
              ))}
            </div>
          </div>

          {/* Header tile — col-span-7, row 1 */}
          <div
            className="reveal flex flex-col justify-center rounded-3xl border-2 border-ink bg-paper p-9 shadow-[6px_6px_0_#001B21] lg:col-span-7"
          >
            <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ Kaip tai veikia</p>
            <h2
              className="mt-3 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 4vw, 72px)',
                lineHeight: '.88',
                letterSpacing: '-.01em',
              }}
            >
              Pasirink planą,
              <br />
              <span
                className="inline-block border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transform: 'rotate(-1.5deg)' }}
              >
                statyk
              </span>{' '}
              pasaulį.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[16px] leading-[1.65] text-ink/65">
              Trys paprasti žingsniai. Jokio klijų, jokių instrukcijų už mokamą užtvarą, jokio ilgalaikio įsipareigojimo.
              Tiesiog kaladėlės prie durų — kiekvieną mėnesį, laiku.
            </p>
          </div>

          {/* Step 02 — col-span-4, row 2 */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-7 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-4"
            style={{ background: steps[1].bg, transitionDelay: '100ms', minHeight: 260 }}
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
          >
            <div>
              <div
                className="text-ink/10 select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 7vw, 88px)', lineHeight: .8 }}
              >
                {steps[1].num}
              </div>
              <h3
                className="mt-1 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.5vw, 32px)', lineHeight: '.88' }}
              >
                {steps[1].title.split('\n').map((l, j) => (
                  <span key={j}>
                    {l}
                    <br />
                  </span>
                ))}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6] text-ink/75">{steps[1].body}</p>
            </div>
            <div className="mt-5 flex gap-2">
              {steps[1].bricks.map((c, i) => (
                <Brick key={i} color={c} />
              ))}
            </div>
          </div>

          {/* Step 03 — col-span-3, row 2 */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-7 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-3"
            style={{ background: steps[2].bg, transitionDelay: '200ms', minHeight: 260 }}
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
          >
            <div>
              <div
                className="text-ink/10 select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 7vw, 88px)', lineHeight: .8 }}
              >
                {steps[2].num}
              </div>
              <h3
                className="mt-1 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: '.88' }}
              >
                {steps[2].title.split('\n').map((l, j) => (
                  <span key={j}>
                    {l}
                    <br />
                  </span>
                ))}
              </h3>
              <p className="mt-3 text-[13px] leading-[1.6] text-ink/75">{steps[2].body}</p>
            </div>
            <div className="mt-5 flex gap-2">
              {steps[2].bricks.map((c, i) => (
                <Brick key={i} color={c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
