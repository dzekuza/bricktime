import FloatDrop from '@/components/FloatDrop'
import { ArrowRightIcon } from 'lucide-react'

interface BrickProps {
  color: string
  studs?: 1 | 2 | 3
  rotate?: number
  size?: number
}

function Brick({ color, studs = 2, rotate = 0, size = 1 }: BrickProps) {
  const w = studs === 1 ? 52 : studs === 2 ? 88 : 124
  const h = 58
  const studW = 28
  const studH = 13
  const studGap = 36
  const bodyY = studH - 3

  const shade = 'rgba(0,0,0,0.18)'
  const highlight = 'rgba(255,255,255,0.15)'

  const studPositions =
    studs === 1
      ? [12]
      : studs === 2
        ? [8, 8 + studGap]
        : [6, 6 + studGap, 6 + studGap * 2]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * size}
      height={h * size}
      fill="none"
      style={{ transform: `rotate(${rotate}deg)`, display: 'block', flexShrink: 0 }}
    >
      {/* Studs */}
      {studPositions.map((x, i) => (
        <rect key={i} x={x} y={0} width={studW} height={studH} rx={6} fill={color} />
      ))}
      {/* Body */}
      <rect x={0} y={bodyY} width={w} height={h - bodyY} rx={7} fill={color} />
      {/* Inner shadow strip */}
      <rect x={6} y={bodyY + 8} width={w - 12} height={h - bodyY - 16} rx={4} fill={shade} />
      {/* Highlight line on top of body */}
      <rect x={0} y={bodyY} width={w} height={4} rx={0} fill={highlight} style={{ borderRadius: '7px 7px 0 0' }} />
    </svg>
  )
}

const bricks: BrickProps[] = [
  { color: '#FFD731', studs: 2, rotate: -9,  size: 1.15 },
  { color: '#FB4903', studs: 1, rotate: 7,   size: 0.9  },
  { color: '#4DA2FF', studs: 3, rotate: -4,  size: 1.05 },
  { color: '#5DDB9C', studs: 2, rotate: 11,  size: 1.2  },
  { color: '#5C4ADE', studs: 1, rotate: -13, size: 1.0  },
  { color: '#FFAEE7', studs: 2, rotate: 6,   size: 0.95 },
  { color: '#FB4903', studs: 3, rotate: -7,  size: 1.1  },
  { color: '#FFD731', studs: 1, rotate: 14,  size: 0.85 },
]

export default function BrickDrop() {
  return (
    <section className="overflow-hidden bg-ink py-24">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        {/* Headline */}
        <div className="mb-16 text-center">
          <h3 className="label-mono text-paper/40">
            ⬢ Kaladėlė po kaladėlės
          </h3>
          <h2
            className="mt-4 heading-display text-d-hero text-paper tracking-[-0.02em] leading-[.86]"
          >
            Statyk
            <br />
            <span
              className="inline-block border-[3px] border-paper/30 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(245,241,235,.12)]"
              style={{ transform: 'rotate(-1.5deg)' }}
            >
              kiekvieną
            </span>{' '}
            mėnesį.
          </h2>
        </div>

        {/* Falling bricks */}
        <FloatDrop
          className="flex items-end justify-center gap-5 flex-wrap"
          stagger={0.1}
          floatDuration={1.1}
          delay={0.1}
        >
          {bricks.map((b, i) => (
            <Brick key={i} {...b} />
          ))}
        </FloatDrop>

        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <a
            href="#plans"
            className="inline-flex items-center gap-2 rounded-full border-2 border-paper bg-paper px-8 py-4 font-bold text-[15px] text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(245,241,235,.3)]"
          >
            Pradėti prenumeratą <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
