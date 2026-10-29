import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const STARS = [1, 2, 3, 4, 5]

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  className?: string
}

export function StarRating({ value, onChange, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {STARS.map((star) => {
        const icon = (
          <StarIcon
            className={cn(
              "size-5",
              star <= value ? "fill-brand-yellow text-ink" : "text-ink/25"
            )}
          />
        )
        if (!onChange) return <span key={star}>{icon}</span>
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} iš 5`}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            {icon}
          </button>
        )
      })}
    </div>
  )
}
