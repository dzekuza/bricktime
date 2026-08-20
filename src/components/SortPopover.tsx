import { useState } from "react"
import { ChevronDownIcon, CheckIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SortPopover<T extends string>({
  value,
  options,
  onChange,
  side = "bottom",
}: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
  side?: "top" | "bottom"
}) {
  const [open, setOpen] = useState(false)
  const label = options.find((o) => o.value === value)?.label ?? value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="brick-hover-sm flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 data-[state=open]:bg-ink data-[state=open]:text-paper">
          <span className="label-mono font-bold whitespace-nowrap">
            Rūšiuoti: {label}
          </span>
          <ChevronDownIcon className="size-3 text-current opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side={side}
        className="w-56 rounded-2xl border-2 border-ink p-1 shadow-[4px_4px_0_#001B21]"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onChange(opt.value)
              setOpen(false)
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-ink/5"
          >
            <span className="label-mono whitespace-nowrap">{opt.label}</span>
            {value === opt.value && <CheckIcon className="size-3 text-ink" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
