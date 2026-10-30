import type { useDiscountCode } from "@/hooks/useDiscountCode"

type Discount = ReturnType<typeof useDiscountCode>

function describe(applied: NonNullable<Discount["applied"]>): string {
  if (applied.kind === "gift") return `−€${applied.amount.toFixed(2)} kreditas`
  return applied.type === "percentage"
    ? `−${applied.value}%`
    : `−€${applied.value.toFixed(2)}`
}

export function DiscountCodeField({ discount }: { discount: Discount }) {
  const { input, setInput, applied, error, loading, apply, clear } = discount

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="plan-change-code" className="label-mono text-ink/50">
        Dovanų kortelė arba nuolaidos kodas
      </label>
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-full border-2 border-ink bg-brand-mint px-4 py-2.5">
          <span className="font-mono text-[13px] font-bold text-ink">
            {applied.code} · {describe(applied)}
          </span>
          <button
            type="button"
            onClick={clear}
            className="font-mono text-[12px] font-bold text-ink underline underline-offset-4"
          >
            Pašalinti
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            id="plan-change-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                apply()
              }
            }}
            placeholder="Įvesk kodą"
            className="h-11 min-w-0 flex-1 rounded-full border-2 border-ink/20 bg-paper px-4 font-mono text-[13px] text-ink uppercase outline-none placeholder:text-ink/30 placeholder:normal-case focus:border-ink"
          />
          <button
            type="button"
            onClick={apply}
            disabled={loading || !input.trim()}
            className="brick-hover-sm h-11 rounded-full border-2 border-ink bg-paper px-5 font-mono text-[12px] font-bold tracking-[.1em] text-ink uppercase disabled:opacity-50"
          >
            {loading ? "…" : "Pritaikyti"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="font-mono text-[12px] text-brand-orange">
          {error}
        </p>
      )}
    </div>
  )
}
