import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAchievements } from "@/hooks/useAchievements"

function AchievementPointsList() {
  const { achievements, loading } = useAchievements()

  if (loading) {
    return (
      <p className="py-4 text-center font-mono text-[12px] text-ink/30">
        Kraunama…
      </p>
    )
  }

  return (
    <ul className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
      {achievements.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-xl border-2 border-ink/10 px-3 py-2"
        >
          <span className="text-[20px] leading-none">{a.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">{a.label}</p>
            <p className="text-[12px] leading-snug text-ink/60">
              {a.description}
            </p>
          </div>
          <span className="font-mono text-[12px] font-bold text-ink">
            +{a.points}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function PointsInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="label-mono mx-auto block text-ink/40 transition-colors hover:text-ink"
        >
          Kaip gauti taškų? →
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_#001B21]">
        <DialogHeader>
          <DialogTitle className="heading-display text-d-xs text-ink">
            Kaip gauti taškų?
          </DialogTitle>
          <DialogDescription className="text-[13px] text-ink/60">
            Taškai skiriami už aktyvumą bendruomenėje. Daugiausiai taškų
            surinkusieji laimi prizus.
          </DialogDescription>
        </DialogHeader>
        <AchievementPointsList />
      </DialogContent>
    </Dialog>
  )
}
