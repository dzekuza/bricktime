type BricksBudgetBarProps = {
  /** Briksiai the sets in the cart are worth together. */
  cartValue: number
  /** Briksiai the member can still spend this period. */
  remaining: number
}

/**
 * Cart value measured against the member's remaining Briksiai. A native
 * <progress> keeps the fill width out of inline styles and stays accessible.
 */
export function BricksBudgetBar({
  cartValue,
  remaining,
}: BricksBudgetBarProps) {
  const isOver = cartValue > remaining
  const max = Math.max(remaining, 1)
  const fillClass = isOver
    ? "[&::-webkit-progress-value]:bg-brand-orange [&::-moz-progress-bar]:bg-brand-orange"
    : "[&::-webkit-progress-value]:bg-brand-mint [&::-moz-progress-bar]:bg-brand-mint"

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-mono text-ink/50">Krepšelio vertė</p>
          <p className="heading-display text-d-sm text-ink">{cartValue}</p>
        </div>
        <div className="text-right">
          <p className="label-mono text-ink/50">Tavo Briksiai</p>
          <p className="heading-display text-d-sm text-ink">{remaining}</p>
        </div>
      </div>

      <progress
        value={Math.min(cartValue, max)}
        max={max}
        aria-label="Krepšelio vertė nuo likusių Briksių"
        className={`mt-3 block h-5 w-full appearance-none overflow-hidden rounded-full border-2 border-ink bg-paper [&::-webkit-progress-bar]:bg-paper ${fillClass}`}
      />

      <p
        className={`mt-2 font-mono text-[12px] ${isOver ? "font-bold text-brand-orange" : "text-ink/60"}`}
      >
        {isOver
          ? `Trūksta ${cartValue - remaining} Briksių – pašalink bent vieną rinkinį.`
          : `Po nuomos liks ${remaining - cartValue} Briksių.`}
      </p>
    </div>
  )
}
