import { useReveal } from '@/hooks/useReveal'

const steps = [
  {
    num: '01',
    title: 'Pick\na plan',
    body: 'Mini, Standard or Mega. Switch tiers any time — keeps stacking with your shelves.',
    bg: '#5DDB9C',
    bricks: ['#FB4903', '#001B21'],
  },
  {
    num: '02',
    title: 'Get the\nmonthly drop',
    body: 'A themed pack arrives the first Tuesday. Open the bag, scan the QR, build the model.',
    bg: '#FFAEE7',
    bricks: ['#4DA2FF', '#F5F1EB'],
  },
  {
    num: '03',
    title: 'Build,\nswap, repeat',
    body: 'Every drop slots into the universe. Trade duplicates inside the BRICKTIME club.',
    bg: '#FFD731',
    bricks: ['#5C4ADE', '#FB4903'],
  },
]

function Brick({ color }: { color: string }) {
  return (
    <div
      className="relative rounded border-[3px] border-ink"
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
        {/*
          Bento 12-col, 2 rows:
          [Step01 col-5 row-2] [Header col-7]
          [               ] [Step02 col-4] [Step03 col-3]
        */}
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Step 01 — big tile, spans 2 rows */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-5 lg:row-span-2"
            style={{ background: steps[0].bg, minHeight: 420 }}
          >
            <div>
              <div className="font-mono text-[10px] tracking-[.24em] uppercase text-ink/60 mb-1">Step</div>
              <div
                className="text-ink/10 select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 130, lineHeight: .8 }}
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
            <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ How it works</p>
            <h2
              className="mt-3 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 4vw, 72px)',
                lineHeight: '.88',
                letterSpacing: '-.01em',
              }}
            >
              Pick a plan,
              <br />
              build the world.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[16px] leading-[1.65] text-ink/65">
              Three simple steps. No glue, no instructions behind a paywall, no long-term lock-in.
              Just bricks at your door — every month, on time.
            </p>
          </div>

          {/* Step 02 — col-span-4, row 2 */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-7 shadow-[6px_6px_0_#001B21] transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21] lg:col-span-4"
            style={{ background: steps[1].bg, transitionDelay: '100ms', minHeight: 260 }}
          >
            <div>
              <div
                className="text-ink/10 select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 88, lineHeight: .8 }}
              >
                {steps[1].num}
              </div>
              <h3
                className="mt-1 uppercase text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: '.88' }}
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
          >
            <div>
              <div
                className="text-ink/10 select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 88, lineHeight: .8 }}
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
