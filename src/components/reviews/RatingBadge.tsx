import { StarIcon } from "lucide-react"

import type { ProductRating } from "@/hooks/useProductRatings"
import { cn } from "@/lib/utils"

type RatingBadgeProps = {
  rating: ProductRating | undefined
  className?: string
}

/** Star, average and review count; renders nothing for a set without reviews. */
export function RatingBadge({ rating, className }: RatingBadgeProps) {
  if (!rating || rating.count === 0) return null

  return (
    <span
      role="img"
      aria-label={`Įvertinimas ${rating.average.toFixed(1)} iš 5, atsiliepimų: ${rating.count}`}
      className={cn(
        "pointer-events-none inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper px-2.5 py-1 font-mono text-[12px] leading-none font-bold text-ink shadow-[2px_2px_0_#001B21]",
        className
      )}
    >
      <StarIcon className="size-3.5 fill-brand-yellow text-ink" />
      {rating.average.toFixed(1)}
      <span className="font-normal text-ink/50">({rating.count})</span>
    </span>
  )
}
