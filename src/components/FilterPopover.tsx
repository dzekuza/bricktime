import { ChevronDownIcon, CheckIcon, XIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function FilterPopover({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const active = selected.length > 0

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="brick-hover-sm flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 data-[state=open]:bg-ink data-[state=open]:text-paper">
          <span className="label-mono font-bold whitespace-nowrap">
            {label}
          </span>
          {active && (
            <span className="flex size-4 items-center justify-center rounded-full bg-ink/10 text-[10px] leading-none font-bold text-ink">
              {selected.length}
            </span>
          )}
          <ChevronDownIcon className="size-3 text-current opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-56 rounded-2xl border-2 border-ink p-2 shadow-[4px_4px_0_#001B21]"
      >
        <div className="max-h-64 overflow-y-auto">
          {options.map(({ value, label: optLabel }) => {
            const checked = selected.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                className={[
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-[11px] font-semibold tracking-[.04em] uppercase transition-colors",
                  checked ? "bg-ink text-paper" : "text-ink hover:bg-ink/5",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    checked
                      ? "border-paper/40 bg-transparent"
                      : "border-ink/30",
                  ].join(" ")}
                >
                  {checked && <CheckIcon className="size-2.5" />}
                </span>
                {optLabel}
              </button>
            )
          })}
        </div>
        {selected.length > 0 && (
          <div className="mt-1 border-t border-ink/10 pt-1">
            <button
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-mono text-[10px] tracking-[.06em] text-ink/40 uppercase transition-colors hover:text-ink"
            >
              <XIcon className="size-3" />
              Išvalyti
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
