interface Invoice {
  id: string
  amount: number
  currency: string
  description: string
  date: number
  pdf: string | null
}

interface Penalty {
  id: string
  amount: number
  reason: string | null
  status: string
  created_at: string | null
}

interface PaymentHistoryProps {
  invoices: Invoice[]
  penalties: Penalty[]
  loading: boolean
}

type Badge =
  | { kind: "pdf"; href: string }
  | { kind: "status"; label: string; className: string }

interface HistoryRow {
  id: string
  title: string
  timestamp: number
  amount: string
  badge: Badge
}

const CHIP =
  "rounded-full border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold tracking-[.12em] uppercase"

const PENALTY_BADGES: Record<string, { label: string; className: string }> = {
  paid: { label: "Bauda sumokėta", className: "bg-brand-mint text-ink" },
  forgiven: {
    label: "Atleista",
    className: "border-ink/30 bg-cream text-ink/60",
  },
}
const PENALTY_PENDING = {
  label: "Laukiama",
  className: "bg-brand-orange text-paper",
}

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

function toRows(invoices: Invoice[], penalties: Penalty[]): HistoryRow[] {
  const invoiceRows = invoices.map<HistoryRow>((inv) => ({
    id: inv.id,
    title: inv.description,
    timestamp: inv.date * 1000,
    amount: `${inv.currency.toUpperCase() === "EUR" ? "€" : inv.currency.toUpperCase()}${inv.amount.toFixed(2)}`,
    badge: inv.pdf
      ? { kind: "pdf", href: inv.pdf }
      : {
          kind: "status",
          label: "Sumokėta",
          className: "bg-brand-mint text-ink",
        },
  }))
  const penaltyRows = penalties.map<HistoryRow>((p) => ({
    id: p.id,
    title: p.reason ?? "Bauda",
    timestamp: new Date(p.created_at ?? 0).getTime(),
    amount: `€${p.amount.toFixed(2)}`,
    badge: {
      kind: "status",
      ...(PENALTY_BADGES[p.status] ?? PENALTY_PENDING),
    },
  }))
  return [...invoiceRows, ...penaltyRows].sort(
    (a, b) => b.timestamp - a.timestamp
  )
}

export function PaymentHistory({
  invoices,
  penalties,
  loading,
}: PaymentHistoryProps) {
  const rows = toRows(invoices, penalties)

  if (loading) {
    return <p className="mt-6 font-mono text-[12px] text-ink/40">Kraunama…</p>
  }

  if (rows.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-start gap-2 py-6">
        <p className="font-display text-[32px] leading-none text-ink/15 uppercase">
          Tuščia
        </p>
        <p className="font-mono text-[12px] text-ink/40">
          Mokėjimų istorija bus rodoma čia
        </p>
      </div>
    )
  }

  return (
    <ul className="mt-4 max-h-[560px] overflow-y-auto">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-col gap-3 border-t-2 border-ink/10 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <p className="text-[15px] leading-snug font-bold text-ink">
              {row.title}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-ink/50">
              {formatDate(row.timestamp)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-display text-[22px] leading-none text-ink">
              {row.amount}
            </span>
            {row.badge.kind === "pdf" ? (
              <a
                href={row.badge.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CHIP} bg-paper text-ink transition-colors hover:bg-ink hover:text-paper`}
              >
                PDF
              </a>
            ) : (
              <span className={`${CHIP} ${row.badge.className}`}>
                {row.badge.label}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
