import { TerminalPicker } from "@/components/TerminalPicker"
import type { LpTerminal } from "@/lib/lpexpress"

export type MerchDeliveryMethod = "terminal" | "courier"

export const MERCH_COURIER_FEE = 3

const OPTIONS: { value: MerchDeliveryMethod; label: string; note: string }[] = [
  { value: "terminal", label: "Paštomatas", note: "Nemokamas" },
  {
    value: "courier",
    label: "Pristatymas kurjeriu",
    note: `+€${MERCH_COURIER_FEE}`,
  },
]

type MerchDeliveryProps = {
  method: MerchDeliveryMethod
  onMethodChange: (method: MerchDeliveryMethod) => void
  terminal: LpTerminal | null
  onTerminalChange: (terminal: LpTerminal | null) => void
}

export function MerchDelivery({
  method,
  onMethodChange,
  terminal,
  onTerminalChange,
}: MerchDeliveryProps) {
  return (
    <div className="mt-5">
      <p className="label-mono mb-2 text-ink/50">Pristatymo būdas</p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(({ value, label, note }) => {
          const isSelected = method === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onMethodChange(value)}
              className={[
                "flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-all",
                isSelected
                  ? "border-ink bg-ink/[.03] shadow-[3px_3px_0_#001B21]"
                  : "border-ink/15 hover:border-ink/40",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected ? "border-ink bg-ink" : "border-ink/30",
                  ].join(" ")}
                >
                  {isSelected && (
                    <span className="size-2 rounded-full bg-paper" />
                  )}
                </span>
                <span className="font-semibold text-ink">{label}</span>
              </div>
              <span className="font-mono text-[11px] text-ink/55">{note}</span>
            </button>
          )
        })}
      </div>
      {method === "terminal" && (
        <div className="mt-4">
          <p className="label-mono mb-1 text-ink/50">Pasirink paštomatą</p>
          <TerminalPicker value={terminal} onChange={onTerminalChange} />
        </div>
      )}
    </div>
  )
}
