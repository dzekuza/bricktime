import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DropProduct {
  id: number
  title: string
  subtitle: string
  image_url: string | null
  bg: string
  release_date: string | null
  early_access_tiers: string[]
  early_access_hours: number
  tier: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const TIER_LABELS: Record<string, string> = {
  nano: 'Mėgėjas',
  mini: 'Kūrėjas',
  standard: 'Masteris',
  pro: 'Meistras',
  mega: 'Legenda',
  mystery_s: 'Mystery Box S',
  mystery_m: 'Mystery Box M',
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

export function NextDrop() {
  const [product, setProduct] = useState<DropProduct | null | undefined>(undefined)
  const [userTier, setUserTier] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [released, setReleased] = useState(false)

  // Fetch next upcoming product
  useEffect(() => {
    async function fetchDrop() {
      const { data } = await supabase
        .from('products')
        .select('id, title, subtitle, image_url, bg, release_date, early_access_tiers, early_access_hours, tier')
        .gt('release_date', new Date().toISOString())
        .order('release_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      setProduct(data ?? null)
    }
    fetchDrop()
  }, [])

  // Fetch user's subscriber tier
  useEffect(() => {
    async function fetchUserTier() {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return
      const { data: sub } = await supabase
        .from('subscribers')
        .select('plan')
        .eq('id', authData.user.id)
        .single()
      if (sub) setUserTier(sub.plan)
    }
    fetchUserTier()
  }, [])

  // Countdown tick
  useEffect(() => {
    if (!product?.release_date) return
    const target = new Date(product.release_date)

    function tick() {
      const now = Date.now()
      if (now >= target.getTime()) {
        setReleased(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft(getTimeLeft(target))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [product])

  // Nothing to show while loading, when no upcoming product, or release_date is unset
  if (product === undefined) return null
  if (product === null || !product.release_date) return null

  const releaseDate = new Date(product.release_date)
  const earlyAccessStart = new Date(releaseDate.getTime() - product.early_access_hours * 3600 * 1000)
  const now = Date.now()
  const inEarlyWindow = now >= earlyAccessStart.getTime() && now < releaseDate.getTime()
  const earlyAccessGranted = inEarlyWindow && userTier !== null && product.early_access_tiers.includes(userTier)

  const earlyTierNames = product.early_access_tiers
    .map((t) => TIER_LABELS[t] ?? t)
    .join(', ')

  const countdownBoxes = [
    { val: timeLeft.days, label: 'Dienos', short: 'd.' },
    { val: timeLeft.hours, label: 'Valandos', short: 'val.' },
    { val: timeLeft.minutes, label: 'Minutės', short: 'min.' },
    { val: timeLeft.seconds, label: 'Sekundės', short: 'sek.' },
  ]

  return (
    <section className="py-4 md:py-16">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
      <div className="relative overflow-hidden bg-ink rounded-3xl px-8 md:px-12 py-10 shadow-[6px_6px_0_#001B21]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none opacity-20"
          style={{ backgroundImage: 'url(/grid.png)', backgroundRepeat: 'repeat', backgroundSize: 'auto' }}
        />
        <div className="label-mono text-white/50 mb-5">Kitas rinkinys</div>

        {released ? (
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <h2 className="heading-display text-d-md text-white shrink-0">
              Naujas rinkinys jau prieinamas!
            </h2>
            <a
              href="/archive"
              className="label-mono text-brand-yellow underline underline-offset-4"
            >
              Peržiūrėti katalogą →
            </a>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
            <h2 className="heading-display text-d-md text-white shrink-0">
              Naujas rinkinys<br />
              <span className="text-brand-yellow">netrukus.</span>
            </h2>

            <div className="relative flex gap-3 flex-1">
              {countdownBoxes.map(({ val, label, short }) => (
                <div
                  key={label}
                  className="relative flex-1 rounded-3xl border-2 border-white/20 bg-white/10 px-2 md:px-3 py-4 text-center"
                >
                  <div className="heading-display text-d-sm text-white">{pad(val)}</div>
                  <div className="label-mono text-white/50 mt-1">
                    <span className="md:hidden">{short}</span>
                    <span className="hidden md:inline">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {earlyAccessGranted && (
              <div className="shrink-0">
                <span className="label-mono bg-brand-yellow text-ink px-3 py-1.5 rounded-lg">
                  Early Access aktyvus
                </span>
              </div>
            )}
            {inEarlyWindow && !earlyAccessGranted && earlyTierNames && (
              <p className="label-mono text-white/50 shrink-0 md:max-w-[200px]">
                {earlyTierNames} nariams {product.early_access_hours}h anksčiau
              </p>
            )}
          </div>
        )}
      </div>
      </div>
    </section>
  )
}
