import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { merch, type MerchItem } from '@/data/merch'

const TYPE_LABEL: Record<string, string> = {
  hoodie: 'Džemperis',
  't-shirt': 'Marškinėliai',
}

function MerchCard({ item }: { item: MerchItem }) {
  const isComingSoon = item.status === 'coming-soon' || item.stock === 0

  return (
    <div className="brick-card brick-card-hover flex flex-col overflow-hidden bg-paper">
      {/* Visual */}
      <div
        className="relative flex min-h-[300px] items-center justify-center p-10"
        style={{ background: item.bg }}
      >
        {/* Type chip */}
        <span
          className="label-mono absolute left-4 top-4 rounded-full border-2 border-paper/30 px-3 py-1 text-paper/70"
        >
          {TYPE_LABEL[item.type]}
        </span>

        {/* Placeholder icon */}
        <div className="flex flex-col items-center gap-3 opacity-30">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            className="text-paper"
          >
            {item.type === 'hoodie' ? (
              <>
                <path d="M28 12 L12 28 L20 32 L20 68 L60 68 L60 32 L68 28 L52 12 C52 12 48 20 40 20 C32 20 28 12 28 12Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none"/>
                <path d="M28 12 C28 12 32 20 40 20 C48 20 52 12 52 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </>
            ) : (
              <>
                <path d="M28 10 L10 28 L20 33 L20 70 L60 70 L60 33 L70 28 L52 10 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none"/>
                <path d="M28 10 C28 10 33 22 52 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </>
            )}
          </svg>
          <span className="font-mono text-[11px] tracking-[.22em] uppercase text-paper/50">
            Iliustracija netrukus
          </span>
        </div>

        {isComingSoon && (
          <span className="label-mono absolute right-4 top-4 rounded-full border-2 border-paper/30 bg-paper/10 px-3 py-1 text-paper/70 backdrop-blur-sm">
            Greitai
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[20px] font-bold uppercase leading-tight text-ink">
            {item.name}
          </h3>
          <span className="shrink-0 font-mono text-[18px] font-bold text-ink">
            €{item.price}
          </span>
        </div>

        <p className="text-[14px] leading-relaxed text-ink/60">{item.description}</p>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1.5">
          {item.sizes.map((size) => (
            <span
              key={size}
              className="rounded-lg border-2 border-ink/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-ink/50"
            >
              {size}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3">
          {isComingSoon ? (
            <div className="flex items-center justify-center rounded-xl border-2 border-ink/20 bg-ink/5 py-3 font-mono text-[12px] font-bold uppercase tracking-[.1em] text-ink/40">
              Netrukus parduotuvėje
            </div>
          ) : (
            <button className="w-full rounded-xl border-2 border-ink bg-ink py-3 font-mono text-[12px] font-bold uppercase tracking-[.1em] text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#001B21]">
              Pirkti →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MerchPage() {
  const activeItems = merch.filter((i) => i.status === 'active')
  const comingItems = merch.filter((i) => i.status !== 'active')

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="overflow-hidden rounded-2xl border-2 border-ink bg-ink p-4 md:rounded-3xl md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="brick-card brick-card-hover flex min-h-[320px] flex-col justify-between bg-ink p-6 md:p-9 lg:col-span-8">
                <div className="label-mono mb-6 flex items-center gap-2.5">
                  <Link to="/" className="text-paper/50 transition-colors hover:text-paper">
                    BRICKTIME
                  </Link>
                  <span className="text-paper/30">/</span>
                  <span className="text-paper/50">Merch</span>
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <h1 className="heading-display text-d-xl max-w-[14ch] tracking-[-0.015em] text-paper">
                    BRICKTIME{' '}
                    <span
                      className="inline-block text-brand-yellow italic"
                      style={{ transform: 'skew(-8deg)' }}
                    >
                      merch.
                    </span>
                  </h1>
                  <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.65] text-paper/70">
                    Drabužiai LEGO mylėtojams. Džemperiai, marškinėliai ir dar daugiau —
                    netrukus parduotuvėje.
                  </p>
                </div>
              </div>

              <div className="brick-card brick-card-hover flex min-h-[320px] flex-col justify-around bg-brand-yellow p-6 md:p-9 lg:col-span-4">
                {[
                  [String(merch.length), 'Produktų'],
                  ['100%', 'Medvilnė'],
                  ['🧱', 'LEGO vibes'],
                ].map(([val, label]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 border-b-2 border-ink/10 pb-8 last:border-b-0 last:pb-0"
                  >
                    <b className="heading-display text-d-lg text-ink">{val}</b>
                    <small className="label-mono text-ink/60">{label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-paper pb-20 pt-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {activeItems.length > 0 && (
            <>
              <div className="mb-6">
                <span className="label-mono text-ink/50">Parduodama dabar</span>
              </div>
              <div className="mb-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {activeItems.map((item) => (
                  <MerchCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}

          {comingItems.length > 0 && (
            <>
              <div className="mb-6 mt-4">
                <span className="label-mono text-ink/50">Netrukus</span>
              </div>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {comingItems.map((item) => (
                  <MerchCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}

          {/* Empty state — nothing at all */}
          {merch.length === 0 && (
            <div className="brick-card flex min-h-[300px] flex-col items-center justify-center gap-4 bg-ink/5 text-center">
              <span className="text-4xl">🧱</span>
              <p className="heading-display text-d-xs text-ink/40">Netrukus čia bus merch</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
