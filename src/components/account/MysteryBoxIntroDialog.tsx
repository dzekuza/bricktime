import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { isMysteryPlan, MYSTERY_ORDERS_PATH } from "@/lib/mystery-box"
import { waitForSubscriberBilling } from "@/lib/wait-for-subscriber"

const SEEN_KEY_PREFIX = "bricktime:mystery-intro-seen"

const seenKey = (userId: string, plan: string) =>
  `${SEEN_KEY_PREFIX}:${userId}:${plan}`

/**
 * After paying for a Mystery plan, explains that the box has to be ordered by
 * hand in Užsakymai. Opens on the Stripe return URL once the webhook has
 * confirmed the plan, and never again for that plan.
 */
export function MysteryBoxIntroDialog() {
  const { user, profile } = useAuth()
  const { search } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const userId = user?.id
  const params = new URLSearchParams(search)
  const returnedPlan =
    params.get("success") === "true" || params.get("plan_changed") === "true"
      ? params.get("plan")
      : null

  useEffect(() => {
    if (!userId || !isMysteryPlan(returnedPlan) || !returnedPlan) return
    if (localStorage.getItem(seenKey(userId, returnedPlan))) return
    const controller = new AbortController()
    void waitForSubscriberBilling(
      userId,
      (s) => s.status === "active" && s.plan === returnedPlan,
      controller.signal
    ).then((row) => {
      if (!row) return
      localStorage.setItem(seenKey(userId, returnedPlan), "1")
      setOpen(true)
    })
    return () => controller.abort()
  }, [userId, returnedPlan])

  // A later re-purchase of the same plan is a new purchase: forget the old mark.
  useEffect(() => {
    if (!userId || !profile) return
    const isMysteryMember =
      isMysteryPlan(profile.plan) && profile.status === "active"
    if (isMysteryMember) return
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${SEEN_KEY_PREFIX}:${userId}:`))
      .forEach((k) => localStorage.removeItem(k))
  }, [userId, profile])

  function goToOrders() {
    setOpen(false)
    navigate(MYSTERY_ORDERS_PATH)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="brick-card max-w-md bg-paper p-6">
        <p className="label-mono text-ink/60">Mystery Box</p>
        <DialogTitle className="heading-display text-d-xs text-ink">
          Dar vienas žingsnis – užsakyk savo dėžę
        </DialogTitle>
        <DialogDescription className="text-[14px] leading-relaxed text-ink/70">
          Mystery Box rinkinį parenkame mes atsitiktine tvarka, todėl jo
          pasirinkti negali. Užsakymą turi pateikti pats: paskyroje, skiltyje
          „Užsakymai“, spausk mygtuką „Užsakyti Mystery Box“ ir pasirink
          pristatymo būdą.
        </DialogDescription>
        <button
          onClick={goToOrders}
          className="brick-hover-sm mt-2 flex w-full items-center justify-between rounded-[24px] border-2 border-ink bg-brand-orange px-6 py-3.5 text-paper transition-all"
        >
          <span className="font-display text-[20px] leading-none">
            Eiti į užsakymus
          </span>
          <span className="font-display text-[28px] leading-none">→</span>
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-[13px] font-bold text-ink/60 underline underline-offset-4 hover:text-ink"
        >
          Padarysiu vėliau
        </button>
      </DialogContent>
    </Dialog>
  )
}
