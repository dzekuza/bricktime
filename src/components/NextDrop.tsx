import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getSubscriptionDisplayName } from "@/lib/subscription-branding"

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
  nano: getSubscriptionDisplayName("nano"),
  mini: getSubscriptionDisplayName("mini"),
  standard: getSubscriptionDisplayName("standard"),
  pro: getSubscriptionDisplayName("pro"),
  mega: getSubscriptionDisplayName("mega"),
  mystery_s: getSubscriptionDisplayName("mystery_s") ?? "Mystery box Mėgėjams",
  mystery_m: getSubscriptionDisplayName("mystery_m") ?? "Mystery Box Kūrėjams",
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
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
  const [product, setProduct] = useState<DropProduct | null | undefined>(
    undefined
  )
  const [userTier, setUserTier] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [released, setReleased] = useState(false)
  const [now] = useState(() => Date.now())

  // Fetch next upcoming product
  useEffect(() => {
    async function fetchDrop() {
      const { data } = await supabase
        .from("products")
        .select(
          "id, title, subtitle, image_url, bg, release_date, early_access_tiers, early_access_hours, tier"
        )
        .gt("release_date", new Date().toISOString())
        .order("release_date", { ascending: true })
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
        .from("subscribers")
        .select("plan")
        .eq("id", authData.user.id)
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
  const earlyAccessStart = new Date(
    releaseDate.getTime() - product.early_access_hours * 3600 * 1000
  )
  const inEarlyWindow =
    now >= earlyAccessStart.getTime() && now < releaseDate.getTime()
  const earlyAccessGranted =
    inEarlyWindow &&
    userTier !== null &&
    product.early_access_tiers.includes(userTier)

  const earlyTierNames = product.early_access_tiers
    .map((t) => TIER_LABELS[t] ?? t)
    .join(", ")

  const countdownBoxes = [
    { val: timeLeft.days, label: "Dienos", short: "d." },
    { val: timeLeft.hours, label: "Valandos", short: "val." },
    { val: timeLeft.minutes, label: "Minutės", short: "min." },
    { val: timeLeft.seconds, label: "Sekundės", short: "sek." },
  ]

  return (
    <section className="pt-16 pb-4 md:pb-6">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        <div className="brick-card flex flex-col gap-6 bg-paper px-6 py-8 md:flex-row md:items-center md:justify-between md:px-12 md:py-10">
          {released ? (
            <>
              <h2 className="heading-display text-d-md shrink-0 text-ink">
                Naujas rinkinys
                <br />
                jau prieinamas!
              </h2>
              <a
                href="/archive"
                className="label-mono text-brand-yellow underline underline-offset-4"
              >
                Peržiūrėti katalogą →
              </a>
            </>
          ) : (
            <>
              <div className="shrink-0">
                <h2 className="heading-display text-d-sm leading-[.9] text-ink">
                  Naujas rinkinys
                </h2>
                <span
                  className="heading-display text-d-sm mt-1 inline-block border-[3px] border-ink/30 bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                  style={{
                    transform: "rotate(-1.5deg)",
                    transformOrigin: "center",
                  }}
                >
                  Netrukus
                </span>
              </div>

              <div className="flex flex-1 gap-3 md:gap-4">
                {countdownBoxes.map(({ val, label, short }) => (
                  <div
                    key={label}
                    className="flex flex-1 flex-col items-center gap-1 rounded-3xl border-2 border-ink/20 bg-paper px-3 py-4 text-center md:px-4"
                  >
                    <span className="heading-display text-[32px] leading-none text-ink md:text-[40px]">
                      {pad(val)}
                    </span>
                    <span className="label-mono text-ink/50">
                      <span className="md:hidden">{short}</span>
                      <span className="hidden md:inline">{label}</span>
                    </span>
                  </div>
                ))}
              </div>

              {earlyAccessGranted && (
                <span className="label-mono shrink-0 rounded-lg bg-brand-yellow px-3 py-1.5 text-ink">
                  Early Access aktyvus
                </span>
              )}
              {inEarlyWindow && !earlyAccessGranted && earlyTierNames && (
                <p className="label-mono shrink-0 text-ink/50 md:max-w-[200px]">
                  {earlyTierNames} nariams {product.early_access_hours}h
                  anksčiau
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
