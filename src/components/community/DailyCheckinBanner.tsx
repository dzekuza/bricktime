import type { DailyCheckin } from "@/hooks/useDailyCheckin"

export function DailyCheckinBanner({ status, error }: DailyCheckin) {
  if (status === "anonymous") return null

  if (status === "error") {
    return (
      <div className="brick-card border-brand-orange/40 bg-brand-orange/10 p-3 text-center font-mono text-[13px] font-bold text-brand-orange">
        ⚠️ Nepavyko pažymėti apsilankymo
        {error ? ` — ${error}` : ""}
      </div>
    )
  }

  return (
    <div
      className={`brick-card p-3 text-center font-mono text-[13px] font-bold ${status === "checkedIn" ? "bg-brand-mint/10 text-brand-mint" : "text-ink/50"}`}
    >
      {status === "checkedIn"
        ? "☀️ Apsilankymas šiandien pažymėtas"
        : "☀️ Žymime tavo apsilankymą…"}
    </div>
  )
}
