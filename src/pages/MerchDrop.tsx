import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { MerchItem } from './Merch'

const TYPE_LABEL: Record<string, string> = {
  hoodie: 'Džemperis',
  't-shirt': 'Marškinėliai',
}

function ClothingIcon({ type }: { type: string }) {
  if (type === 'hoodie') {
    return (
      <svg width="120" height="120" viewBox="0 0 80 80" fill="none" className="text-current">
        <path d="M28 12 L12 28 L20 32 L20 68 L60 68 L60 32 L68 28 L52 12 C52 12 48 20 40 20 C32 20 28 12 28 12Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none"/>
        <path d="M28 12 C28 12 32 20 40 20 C48 20 52 12 52 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
  return (
    <svg width="120" height="120" viewBox="0 0 80 80" fill="none" className="text-current">
      <path d="M28 10 L10 28 L20 33 L20 70 L60 70 L60 33 L70 28 L52 10 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none"/>
      <path d="M28 10 C28 10 33 22 52 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export default function MerchDrop() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState<MerchItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [buying, setBuying] = useState(false)

  const paymentSuccess = searchParams.get('payment') === 'success'

  useEffect(() => {
    if (!slug) return
    supabase
      .from('merch_items')
      .select('*')
      .eq('slug', slug)
      .in('status', ['active', 'coming-soon'])
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate('/merch', { replace: true })
          return
        }
        setItem(data as MerchItem)
        setLoading(false)
      })
  }, [slug, navigate])

  if (loading) {
    return (
      <>
        <Nav />
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-7">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="brick-card animate-pulse h-[480px] bg-ink/10" />
            <div className="flex flex-col gap-4">
              <div className="h-8 w-2/3 rounded bg-ink/10" />
              <div className="h-4 w-1/3 rounded bg-ink/10" />
              <div className="h-20 rounded bg-ink/10" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!item) return null

  const isComingSoon = item.status === 'coming-soon' || item.stock === 0

  async function handleBuy() {
    if (!selectedSize || !item) return
    setBuying(true)
    const origin = window.location.origin
    const { data, error } = await supabase.functions.invoke('create-merch-checkout', {
      body: {
        itemId: item.id,
        size: selectedSize,
        userEmail: user?.email ?? undefined,
        successUrl: `${origin}/merch/${item.slug}?payment=success`,
        cancelUrl: `${origin}/merch/${item.slug}`,
      },
    })
    if (error || !data?.url) {
      setBuying(false)
      return
    }
    window.location.href = data.url
  }
  const isDark = item.bg === '#001B21' || item.bg.toLowerCase() === '#001b21'
  const contentColor = isDark ? 'text-paper/30' : 'text-ink/30'

  return (
    <>
      <Nav />

      <div className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">

          {/* Breadcrumb */}
          <div className="label-mono mb-6 flex items-center gap-2.5 text-ink/50">
            <Link to="/" className="transition-colors hover:text-ink">BRICKTIME</Link>
            <span className="text-ink/30">/</span>
            <Link to="/merch" className="transition-colors hover:text-ink">Merch</Link>
            <span className="text-ink/30">/</span>
            <span className="text-ink/80">{item.name}</span>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Visual */}
            <div
              className="brick-card flex min-h-[480px] items-center justify-center p-14"
              style={{ background: item.bg }}
            >
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="max-h-[400px] w-full object-contain" />
              ) : (
                <div className={`flex flex-col items-center gap-4 opacity-25 ${contentColor}`}>
                  <ClothingIcon type={item.type} />
                  <span className="font-mono text-[11px] tracking-[.22em] uppercase">
                    Iliustracija netrukus
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-6 py-2">
              <div>
                <span className="label-mono mb-3 inline-block text-ink/50">
                  {TYPE_LABEL[item.type]}
                </span>
                <h1 className="heading-display text-d-md text-ink">{item.name}</h1>
                <p className="mt-3 font-mono text-[28px] font-bold text-ink">€{item.price}</p>
              </div>

              <p className="text-[16px] leading-relaxed text-ink/65">{item.description}</p>

              {/* Size picker */}
              <div className="flex flex-col gap-3">
                <span className="label-mono text-ink/50">
                  Dydis{selectedSize ? ` — ${selectedSize}` : ''}
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.sizes.map((size) => (
                    <button
                      key={size}
                      disabled={isComingSoon}
                      onClick={() => setSelectedSize(size)}
                      className={[
                        'rounded-xl border-2 px-4 py-2 font-mono text-[13px] font-bold uppercase transition-all',
                        isComingSoon
                          ? 'border-ink/15 text-ink/25 cursor-not-allowed'
                          : selectedSize === size
                            ? 'border-ink bg-ink text-paper shadow-[3px_3px_0_#001B21]'
                            : 'border-ink/30 text-ink hover:border-ink',
                      ].join(' ')}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Success banner */}
              {paymentSuccess && (
                <div className="brick-card flex flex-col gap-2 bg-[#5DDB9C] p-5">
                  <p className="font-display text-[22px] font-bold uppercase text-ink">✓ Užsakymas gautas!</p>
                  <p className="text-[14px] leading-relaxed text-ink/70">
                    Ačiū! Patvirtinimą gausite el. paštu. Produktas bus išsiųstas per 3–5 d. d.
                  </p>
                </div>
              )}

              {/* CTA */}
              {!paymentSuccess && (
                <div className="mt-2">
                  {isComingSoon ? (
                    <div className="brick-card flex flex-col gap-3 bg-ink/[0.03] p-6">
                      <p className="label-mono text-ink/40">Dar ne parduotuvėje</p>
                      <p className="text-[15px] leading-relaxed text-ink/55">
                        Šis produktas kol kas ruošiamas. Seki BRICKTIME naujienoms ir sužinok pirmasis,
                        kai merch atsiras parduotuvėje.
                      </p>
                    </div>
                  ) : (
                    <button
                      disabled={!selectedSize || buying}
                      onClick={handleBuy}
                      className="w-full rounded-xl border-2 border-ink bg-ink py-4 font-mono text-[14px] font-bold uppercase tracking-[.08em] text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#001B21] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {buying ? 'Kraunama…' : selectedSize ? `Pirkti — ${selectedSize}` : 'Pasirink dydį'}
                    </button>
                  )}
                </div>
              )}

              {/* Back */}
              <Link
                to="/merch"
                className="label-mono mt-2 inline-flex items-center gap-1.5 text-ink/40 transition-colors hover:text-ink"
              >
                ← Visi merch produktai
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
