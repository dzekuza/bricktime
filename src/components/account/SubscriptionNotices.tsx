interface SubscriptionNoticesProps {
  pendingPlanName: string | null
  pendingCredits: number | null
  cancelRequested: boolean
  cancelAt: string | null
  busy: boolean
  onWithdrawPlan: () => void
  onUndoCancel: () => void
}

interface NoticeProps {
  message: string
  actionLabel: string
  busy: boolean
  onAction: () => void
}

function Notice({ message, actionLabel, busy, onAction }: NoticeProps) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-2xl border-2 border-ink bg-brand-yellow px-4 py-3"
    >
      <p className="font-mono text-[12px] font-bold text-ink">{message}</p>
      <button
        onClick={onAction}
        disabled={busy}
        className="brick-hover-sm self-start rounded-xl border-2 border-ink bg-paper px-3 py-2 font-mono text-[11px] tracking-[.14em] text-ink uppercase transition-all disabled:pointer-events-none disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </div>
  )
}

// What is still in motion on the subscription: a cheaper plan waiting for the
// next renewal, or a cancellation waiting for sets to come back.
export function SubscriptionNotices({
  pendingPlanName,
  pendingCredits,
  cancelRequested,
  cancelAt,
  busy,
  onWithdrawPlan,
  onUndoCancel,
}: SubscriptionNoticesProps) {
  return (
    <>
      {pendingPlanName && (
        <Notice
          message={`${pendingPlanName} prenumerata įsigalios nuo kito nuskaitymo, jei iki tol grąžinsi rinkinius, viršijančius ${pendingCredits ?? 0} briksių. Kol kas lieka dabartinis planas.`}
          actionLabel="Atšaukti keitimą"
          busy={busy}
          onAction={onWithdrawPlan}
        />
      )}
      {cancelRequested && (
        <Notice
          message="Prenumeratą atšauksime, kai grąžinsi visus rinkinius. Kol jie pas tave, mokestis tęsiasi."
          actionLabel="Neatšaukti"
          busy={busy}
          onAction={onUndoCancel}
        />
      )}
      {!cancelRequested && cancelAt && (
        <Notice
          message={`Prenumerata baigsis ${new Date(cancelAt).toLocaleDateString("lt-LT")}.`}
          actionLabel="Tęsti prenumeratą"
          busy={busy}
          onAction={onUndoCancel}
        />
      )}
    </>
  )
}
