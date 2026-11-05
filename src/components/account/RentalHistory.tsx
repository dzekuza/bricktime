import { ImagePlaceholder } from "@/components/ImagePlaceholder"
import { STATUS_BADGES } from "@/components/account/order-status"
import type { RentedOrder } from "@/components/account/RentedOrderCard"

// Dates arrive either as a plain date (start_date) or a full timestamp.
const formatDate = (value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return date.toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function HistoryDate({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div>
      <dt className="label-mono text-ink/40">{label}</dt>
      <dd className="mt-0.5 font-mono text-[12px] text-ink">{value ?? "—"}</dd>
    </div>
  )
}

function HistoryRow({ order }: { order: RentedOrder }) {
  const badge = STATUS_BADGES[order.status]
  return (
    <li className="flex flex-col gap-3 border-b-2 border-ink/10 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink/10 bg-cream">
          {order.productImage ? (
            <img
              src={order.productImage}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <ImagePlaceholder compact />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] text-ink">
            {order.productTitle}
          </p>
          {badge && (
            <span
              className={`mt-1 inline-block rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[.1em] uppercase ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-4 sm:w-[440px]">
        <HistoryDate label="Paimta" value={formatDate(order.startDate)} />
        <HistoryDate
          label="Grąžinimas užsakytas"
          value={formatDate(order.returnRequestedAt)}
        />
        <HistoryDate label="Grąžinta" value={formatDate(order.returnedAt)} />
      </dl>
    </li>
  )
}

// Every rental the member has had, newest first, including returned sets.
export function RentalHistory({ orders }: { orders: RentedOrder[] }) {
  return (
    <div className="brick-card mt-8 bg-paper p-5 md:p-6">
      <p className="label-mono text-ink/40">Nuomos istorija</p>
      <ul className="mt-2">
        {orders.map((order) => (
          <HistoryRow key={order.id} order={order} />
        ))}
      </ul>
    </div>
  )
}
