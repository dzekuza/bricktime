import { Link } from "react-router-dom"

import { usePendingMysteryOrder } from "@/hooks/usePendingMysteryOrder"
import { MYSTERY_ORDERS_PATH } from "@/lib/mystery-box"

/** Top bar for Mystery Box members who haven't ordered their box yet. */
export function MysteryBoxOrderBar() {
  const isPending = usePendingMysteryOrder()
  if (!isPending) return null

  return (
    <div className="border-b-2 border-ink bg-brand-yellow">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-center gap-1 px-4 py-2 text-center sm:flex-row sm:gap-4 md:px-7">
        <p className="text-[13px] font-bold text-ink">
          Tavo Mystery Box dar neužsakyta – rinkinį parinksime mes.
        </p>
        <Link
          to={MYSTERY_ORDERS_PATH}
          className="text-[13px] font-bold whitespace-nowrap text-ink underline underline-offset-4"
        >
          Užsakyti dabar →
        </Link>
      </div>
    </div>
  )
}
