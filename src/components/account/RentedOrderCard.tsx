import { OrderTracking } from "@/components/OrderTracking"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"

export interface RentedOrder {
  id: string
  productId: number
  productTitle: string
  productImage: string | null
  status: string
  startDate: string
  dueDate: string
  amount: number
  returnNote?: string
  homeDelivery: boolean
  terminalName?: string | null
  barcode?: string | null
  returnBarcode?: string | null
}

interface RentedOrderCardProps {
  order: RentedOrder
  isDownloadingLabel: boolean
  onRequestReturn: () => void
  onReportMissingPart: () => void
  onDownloadLabel: () => void
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Pas tave", className: "bg-brand-mint text-ink" },
  processing: { label: "Ruošiama", className: "bg-brand-sky text-ink" },
  overdue: { label: "Vėluoja", className: "bg-brand-orange text-paper" },
  return_requested: {
    label: "Grąžinimas prašomas",
    className: "bg-brand-yellow text-ink",
  },
  return_declined: {
    label: "Grąžinimas atsisakytas",
    className: "bg-brand-pink text-ink",
  },
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink/10 py-2.5">
      <dt className="label-mono text-ink/40">{label}</dt>
      <dd className="text-right font-mono text-[13px] font-bold text-ink">
        {value}
      </dd>
    </div>
  )
}

const ACTION_BASE =
  "h-11 w-full rounded-full border-2 px-4 text-[13px] font-bold transition-all"

export function RentedOrderCard({
  order,
  isDownloadingLabel,
  onRequestReturn,
  onReportMissingPart,
  onDownloadLabel,
}: RentedOrderCardProps) {
  const badge = STATUS_BADGES[order.status]
  const canReturn = ["active", "overdue", "return_declined"].includes(
    order.status
  )
  const canReportPart = ["active", "overdue"].includes(order.status)
  const delivery = order.homeDelivery
    ? "Į duris"
    : order.terminalName
      ? `Paštomatas · ${order.terminalName}`
      : "Paštomatas"

  return (
    <div className="brick-card flex flex-col gap-4 bg-paper p-5 md:p-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-ink/10 bg-paper">
        {order.productImage ? (
          <img
            src={order.productImage}
            alt={order.productTitle}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {badge && (
          <span
            className={`w-fit rounded-full border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold tracking-[.14em] uppercase ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.2em] font-display text-[19px] leading-[1.1] text-ink uppercase">
          {order.productTitle}
        </h3>
      </div>

      {order.returnNote && order.status === "return_declined" && (
        <div className="rounded-2xl border-2 border-ink/15 bg-cream px-4 py-3">
          <p className="label-mono text-ink/50">Priežastis</p>
          <p className="mt-1 text-[14px] leading-snug text-ink">
            {order.returnNote}
          </p>
        </div>
      )}

      <dl>
        <MetaRow label="Pristatymas" value={delivery} />
        <MetaRow label="Grąžinti iki" value={formatDate(order.dueDate)} />
        <MetaRow label="Mokestis" value={`€${order.amount}/mėn.`} />
      </dl>

      {/* Live LP EXPRESS tracking — outbound, then return */}
      {order.barcode && <OrderTracking barcode={order.barcode} />}
      {order.returnBarcode && (
        <div>
          <p className="label-mono mb-1 text-ink/40">Grąžinimo siunta</p>
          <OrderTracking barcode={order.returnBarcode} />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {canReturn && (
          <button
            onClick={onRequestReturn}
            className={`${ACTION_BASE} brick-hover-sm border-ink bg-ink text-paper`}
          >
            {order.status === "return_declined"
              ? "Prašyti dar kartą"
              : "Prašyti grąžinimo"}
          </button>
        )}
        {canReportPart && (
          <button
            onClick={onReportMissingPart}
            className={`${ACTION_BASE} border-ink/30 bg-transparent text-ink/70 hover:border-ink hover:text-ink`}
          >
            Pranešti apie trūkstamą detalę
          </button>
        )}
        {order.status === "return_requested" &&
          (order.returnBarcode ? (
            <button
              onClick={onDownloadLabel}
              disabled={isDownloadingLabel}
              className={`${ACTION_BASE} brick-hover-sm border-ink bg-brand-orange text-paper disabled:opacity-50`}
            >
              {isDownloadingLabel
                ? "Ruošiama…"
                : "Atsisiųsti grąžinimo etiketę"}
            </button>
          ) : (
            <p
              className={`${ACTION_BASE} flex items-center justify-center border-ink/20 bg-cream text-ink/70`}
            >
              Grąžinimas prašomas
            </p>
          ))}
        {order.status === "processing" && (
          <p
            className={`${ACTION_BASE} flex items-center justify-center border-ink/20 bg-cream text-ink/70`}
          >
            Ruošiama siuntai
          </p>
        )}
      </div>
    </div>
  )
}
