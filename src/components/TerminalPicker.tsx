import { useEffect, useRef, useState } from "react"
import { fetchTerminals, type LpTerminal } from "@/lib/lpexpress"

interface TerminalPickerProps {
  value: LpTerminal | null
  onChange: (terminal: LpTerminal | null) => void
}

/** Searchable LP EXPRESS parcel-terminal (paštomatas) selector. */
export function TerminalPicker({ value, onChange }: TerminalPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LpTerminal[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        setResults(await fetchTerminals(q.length >= 2 ? q : undefined))
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, open])

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative mt-3" ref={boxRef}>
      {value ? (
        <div className="flex items-center justify-between rounded-2xl border-2 border-ink bg-brand-mint/30 px-5 py-4 shadow-[3px_3px_0_#001B21]">
          <div className="min-w-0">
            <p className="truncate font-mono text-[14px] font-bold text-ink">{value.name}</p>
            {(value.address || value.city) && (
              <p className="truncate text-[12px] text-ink/60">
                {[value.address, value.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(true)
            }}
            className="ml-3 shrink-0 rounded-full border-2 border-ink/20 px-3 py-1 font-mono text-[11px] font-bold text-ink hover:border-ink/50"
          >
            Keisti
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            placeholder="Ieškok paštomato (miestas, adresas)…"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            className="w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 font-mono text-[14px] text-ink outline-none focus:border-ink"
          />
          {open && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_#001B21]">
              {loading && <p className="px-5 py-4 text-[13px] text-ink/50">Kraunama…</p>}
              {error && <p className="px-5 py-4 text-[13px] text-red-600">{error}</p>}
              {!loading && !error && results.length === 0 && (
                <p className="px-5 py-4 text-[13px] text-ink/50">Nieko nerasta</p>
              )}
              {!loading &&
                !error &&
                results.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onChange(t)
                      setOpen(false)
                      setQuery("")
                    }}
                    className="flex w-full flex-col items-start gap-0.5 border-b-2 border-ink/10 px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-brand-mint/20"
                  >
                    <span className="font-mono text-[13px] font-bold text-ink">{t.name}</span>
                    {(t.address || t.city) && (
                      <span className="text-[12px] text-ink/60">
                        {[t.address, t.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
