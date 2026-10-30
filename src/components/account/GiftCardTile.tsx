interface GiftCard {
  id: string
  code: string
  amount_cents: number
  recipient_email: string
  buyer_email: string
  message: string | null
  status: string
  expires_at: string
}

interface GiftCardTileProps {
  card: GiftCard
  userEmail: string | undefined
  copied: boolean
  onCopy: () => void
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Aktyvus", className: "bg-brand-mint text-ink" },
  used: {
    label: "Panaudotas",
    className: "border-ink/30 bg-cream text-ink/60",
  },
}
const STATUS_EXPIRED = {
  label: "Pasibaigęs",
  className: "border-ink/30 bg-cream text-ink/60",
}

function getRole(card: GiftCard, userEmail: string | undefined): string {
  const isBuyer = card.buyer_email === userEmail
  const isRecipient = card.recipient_email === userEmail
  if (isBuyer && isRecipient) return "Nupirkta sau"
  return isBuyer ? "Nupirkta" : "Gauta"
}

export function GiftCardTile({
  card,
  userEmail,
  copied,
  onCopy,
}: GiftCardTileProps) {
  const isActive = card.status === "active"
  const badge = STATUS_BADGES[card.status] ?? STATUS_EXPIRED
  const expires = new Date(card.expires_at).toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div
      className={`brick-card flex flex-col gap-5 bg-paper p-5 md:p-6 ${isActive ? "" : "opacity-70"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-mono text-ink/50">
          {getRole(card, userEmail)}
        </span>
        <span
          className={`rounded-full border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold tracking-[.12em] uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div>
        <p className="font-display text-[44px] leading-none text-ink">
          €{card.amount_cents / 100}
        </p>
        <p className="mt-2 font-mono text-[12px] text-ink/50">
          Galioja iki {expires}
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-cream px-4 py-3 text-center">
        <span className="font-mono text-[18px] font-bold tracking-[.12em] break-all text-ink">
          {card.code}
        </span>
      </div>

      {card.message && (
        <p className="text-[14px] leading-relaxed text-ink/60 italic">
          „{card.message}“
        </p>
      )}

      {isActive && (
        <button
          onClick={onCopy}
          className="brick-hover-sm mt-auto h-11 w-full rounded-full border-2 border-ink bg-ink px-4 font-mono text-[12px] font-bold tracking-[.1em] text-paper uppercase transition-all"
        >
          {copied ? "Nukopijuota" : "Kopijuoti kodą"}
        </button>
      )}
    </div>
  )
}
