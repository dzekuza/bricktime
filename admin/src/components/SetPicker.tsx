import { useEffect, useMemo, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchInput } from "@/components/ui/search-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface SetOption {
  id: number
  title: string
  category: string
  year: number
  imageUrl: string | null
  allowedTiers: string[]
}

interface SetPickerProps {
  /** Customer the set is for; drives the "already received" marking. */
  customerId: string | null
  customerPlan: string | null
  value: number | null
  onChange: (productId: number | null) => void
}

const ALL = "all"

// Long set titles must truncate inside the dialog instead of stretching it.
const FILTER_TRIGGER_CLASS =
  "w-full min-w-0 *:data-[slot=select-value]:block! *:data-[slot=select-value]:truncate"

const formatDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("lt-LT")

/** Searchable, filterable list of sets that flags the ones the customer already had. */
export function SetPicker({
  customerId,
  customerPlan,
  value,
  onChange,
}: SetPickerProps) {
  const [sets, setSets] = useState<SetOption[]>([])
  const [received, setReceived] = useState<Map<number, string>>(new Map())
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(ALL)
  const [year, setYear] = useState(ALL)
  const [planAllowsOnly, setPlanAllowsOnly] = useState(false)
  // Off by default: received sets stay in the list, marked red, so the admin sees the history.
  const [hideReceived, setHideReceived] = useState(false)

  useEffect(() => {
    void supabase
      .from("products")
      .select("id, title, category, year, image_url, allowed_tiers")
      .neq("status", "sold_out")
      .order("title")
      .then(({ data }) => {
        setSets(
          (data ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category,
            year: p.year,
            imageUrl: p.image_url,
            allowedTiers: p.allowed_tiers ?? [],
          }))
        )
      })
  }, [])

  useEffect(() => {
    setReceived(new Map())
    if (!customerId) return
    let cancelled = false
    // Every past order counts, returned ones too: the point is never repeating a set.
    void supabase
      .from("orders")
      .select("product_id, start_date")
      .eq("subscriber_id", customerId)
      .not("product_id", "is", null)
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        const latest = new Map<number, string>()
        for (const o of data ?? []) {
          if (o.product_id !== null && !latest.has(o.product_id))
            latest.set(o.product_id, o.start_date)
        }
        setReceived(latest)
      })
    return () => {
      cancelled = true
    }
  }, [customerId])

  const categories = useMemo(
    () => [...new Set(sets.map((s) => s.category))].sort(),
    [sets]
  )
  const years = useMemo(
    () => [...new Set(sets.map((s) => s.year))].sort((a, b) => b - a),
    [sets]
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sets.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q)) return false
      if (category !== ALL && s.category !== category) return false
      if (year !== ALL && String(s.year) !== year) return false
      if (
        planAllowsOnly &&
        customerPlan &&
        !s.allowedTiers.includes(customerPlan)
      )
        return false
      // Keep the chosen set visible so it can't vanish behind a filter.
      if (hideReceived && received.has(s.id) && s.id !== value) return false
      return true
    })
  }, [
    sets,
    search,
    category,
    year,
    planAllowsOnly,
    customerPlan,
    hideReceived,
    received,
    value,
  ])

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <SearchInput
        label="Search sets" placeholder="Search sets…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className={FILTER_TRIGGER_CLASS}>
            <SelectValue placeholder="Series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All series</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className={FILTER_TRIGGER_CLASS}>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {customerPlan && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="set-plan-allows"
              checked={planAllowsOnly}
              onCheckedChange={(v) => setPlanAllowsOnly(v === true)}
            />
            <Label htmlFor="set-plan-allows" className="text-xs font-normal">
              Open to {customerPlan}
            </Label>
          </div>
        )}
        {customerId && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="set-hide-received"
              checked={hideReceived}
              onCheckedChange={(v) => setHideReceived(v === true)}
            />
            <Label htmlFor="set-hide-received" className="text-xs font-normal">
              Hide already received
            </Label>
          </div>
        )}
      </div>

      <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-lg border border-input">
        {visible.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            No sets match.
          </li>
        )}
        {visible.map((s) => {
          const receivedOn = received.get(s.id)
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onChange(s.id)}
                aria-pressed={s.id === value}
                className={cn(
                  "flex w-full min-w-0 items-center gap-3 px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:bg-accent",
                  s.id === value && "bg-accent",
                  receivedOn && "border-l-2 border-destructive bg-destructive/10"
                )}
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "size-10 shrink-0 rounded object-cover",
                      receivedOn && "opacity-60"
                    )}
                  />
                ) : (
                  <span className="size-10 shrink-0 rounded bg-muted" aria-hidden="true" />
                )}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={cn("truncate", receivedOn && "text-destructive")}
                  >
                    {s.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[s.year, s.category].join(" · ")}
                    {receivedOn && (
                      <span className="text-destructive">
                        {" "}
                        · Already received {formatDate(receivedOn)}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {visible.length} of {sets.length} sets
      </p>
    </div>
  )
}
