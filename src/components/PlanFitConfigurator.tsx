import { useEffect, useMemo, useState } from "react"
import { XIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { tierConfig, type Tier } from "@/components/ProductCard"

interface LiteProduct {
  id: number
  title: string
  subtitle: string
  imageUrl: string | null
  tier: Tier
  value: number
}

interface PlanFitConfiguratorProps {
  tierLevel: number
  planName: string
  budgetCredits: number
  currentProductId?: number
}

export function PlanFitConfigurator({
  tierLevel,
  planName,
  budgetCredits,
  currentProductId,
}: PlanFitConfiguratorProps) {
  const [products, setProducts] = useState<LiteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    currentProductId ? [currentProductId] : []
  )

  useEffect(() => {
    const allowedTierKeys = (Object.keys(tierConfig) as Tier[]).filter(
      (key) => tierConfig[key].level <= tierLevel
    )
    setLoading(true)
    supabase
      .from("products")
      .select("id, title, subtitle, image_url, tier, value")
      .in("tier", allowedTierKeys)
      .order("id", { ascending: false })
      // NOTE: this is a lightweight preview, not the full catalog — a cap keeps
      // the payload small. Move to a paginated/searchable fetch if this grows.
      .limit(60)
      .then(({ data }) => {
        if (data) {
          setProducts(
            data.map((row) => ({
              id: row.id,
              title: row.title,
              subtitle: row.subtitle,
              imageUrl: row.image_url,
              tier: row.tier as Tier,
              value: row.value ?? 0,
            }))
          )
        }
        setLoading(false)
      })
  }, [tierLevel])

  const eligibleProducts = useMemo(
    () => products.filter((p) => (tierConfig[p.tier]?.level ?? 0) <= tierLevel),
    [products, tierLevel]
  )

  const selectedProducts = useMemo(
    () => eligibleProducts.filter((p) => selectedIds.includes(p.id)),
    [eligibleProducts, selectedIds]
  )

  const pickerProducts = useMemo(() => {
    const notSelected = eligibleProducts.filter(
      (p) => !selectedIds.includes(p.id)
    )
    if (!query.trim()) return notSelected
    const q = query.trim().toLowerCase()
    return notSelected.filter((p) => p.title.toLowerCase().includes(q))
  }, [eligibleProducts, selectedIds, query])

  const usedBudget = selectedProducts.reduce((sum, p) => sum + p.value, 0)
  const remainingBudget = budgetCredits - usedBudget
  const overBudget = remainingBudget < 0
  const pct =
    budgetCredits > 0 ? Math.min(100, (usedBudget / budgetCredits) * 100) : 0

  function toggleProduct(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="brick-card mt-4 bg-white p-6 md:p-8">
      <p className="label-mono text-ink/40">Ar šis planas tau tinka?</p>
      <h2 className="heading-display text-d-sm mt-2 text-ink">
        Pasitikrink, kiek produktų telpa į{" "}
        <span className="inline-block -rotate-[1deg] border-2 border-ink bg-brand-yellow px-2">
          {planName}
        </span>
      </h2>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-ink/65">
        Su {planName} planu turėsi {budgetCredits} Kr. kas mėnesį — pasirink
        produktus žemiau ir pažiūrėk, kiek jų vienu metu tilptų.
      </p>

      {/* Budget meter */}
      <div className="mt-6">
        <div className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-ink/[.03]">
          <div
            className={`h-full rounded-full transition-[width] ${overBudget ? "bg-brand-orange" : "bg-brand-mint"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[12px] font-bold tracking-[.04em] text-ink uppercase">
          <span>
            {selectedProducts.length} produktai · {usedBudget}/{budgetCredits}{" "}
            Kr.
          </span>
          {overBudget ? (
            <span className="text-brand-orange">
              Viršyta {Math.abs(remainingBudget)} Kr.
            </span>
          ) : (
            <span className="text-ink/50">{remainingBudget} Kr. liko</span>
          )}
        </div>
      </div>

      {/* Selected items */}
      {selectedProducts.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {selectedProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3"
            >
              <div className="size-10 shrink-0 overflow-hidden rounded-lg border-2 border-ink/10 bg-[#f8f6f2]">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-contain p-1"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">
                  {p.title}
                </p>
                <p className="truncate text-[12px] text-ink/50">{p.subtitle}</p>
              </div>
              <span className="rounded-full border-2 border-ink/20 px-3 py-1 font-mono text-[11px] font-bold text-ink">
                {p.value} Kr.
              </span>
              <button
                type="button"
                onClick={() => toggleProduct(p.id)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink/20 text-ink/50 transition-colors hover:border-ink hover:text-ink"
                aria-label="Pašalinti"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add more */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="label-mono text-ink/40">Pridėti produktų</p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ieškoti..."
            className="rounded-full border-2 border-ink/20 px-3 py-1.5 text-[13px] outline-none focus:border-ink"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-ink/10"
              />
            ))}
          </div>
        ) : eligibleProducts.length === 0 ? (
          <p className="text-[14px] text-ink/50">
            Šiam planui šiuo metu nėra produktų peržiūrai.
          </p>
        ) : (
          <div className="grid max-h-[420px] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
            {pickerProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className="flex flex-col items-start gap-1.5 rounded-2xl border-2 border-ink/20 p-2.5 text-left transition-all hover:border-ink/50"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg border-2 border-ink/10 bg-[#f8f6f2]">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-full w-full object-contain p-2"
                    />
                  )}
                </div>
                <p className="line-clamp-1 w-full text-[12px] font-bold text-ink">
                  {p.title}
                </p>
                <span className="rounded-full border-2 border-ink/20 px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
                  {p.value} Kr.
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
