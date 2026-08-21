type FeedItemStatus = "pending" | "approved" | "rejected"

const LABELS: Record<Exclude<FeedItemStatus, "approved">, string> = {
  pending: "Laukia patvirtinimo",
  rejected: "Atmesta",
}

const COLORS: Record<Exclude<FeedItemStatus, "approved">, string> = {
  pending: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  rejected: "border-ink/30 bg-ink/5 text-ink/50",
}

export function StatusBadge({ status }: { status: FeedItemStatus }) {
  if (status === "approved") return null

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[.1em] uppercase ${COLORS[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
