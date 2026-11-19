import type { ReactNode } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

type QuantityStepperProps = {
  value: number
  max: number
  disabled?: boolean
  onChange: (value: number) => void
}

export function QuantityStepper({
  value,
  max,
  disabled = false,
  onChange,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-3">
      <StepButton
        label="Mažinti kiekį"
        isDisabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon className="size-4" />
      </StepButton>
      <span
        aria-live="polite"
        className="min-w-8 text-center font-mono text-[16px] font-bold text-ink"
      >
        {value}
      </span>
      <StepButton
        label="Didinti kiekį"
        isDisabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className="size-4" />
      </StepButton>
    </div>
  )
}

type StepButtonProps = {
  label: string
  isDisabled: boolean
  onClick: () => void
  children: ReactNode
}

function StepButton({ label, isDisabled, onClick, children }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border-2 border-ink text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
