import { useEffect, useState } from "react"

const SECOND_MS = 1000
const MINUTE_S = 60
const HOUR_S = 3600
const DAY_S = 86400

function getParts(totalSeconds: number) {
  return [
    { label: "Dienos", value: Math.floor(totalSeconds / DAY_S) },
    { label: "Valandos", value: Math.floor((totalSeconds % DAY_S) / HOUR_S) },
    { label: "Minutės", value: Math.floor((totalSeconds % HOUR_S) / MINUTE_S) },
    { label: "Sekundės", value: totalSeconds % MINUTE_S },
  ]
}

/** Ticking countdown to the store opening; renders nothing once the time has passed. */
export function OpenCountdown({ openAt }: { openAt: Date }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), SECOND_MS)
    return () => window.clearInterval(id)
  }, [])

  const remainingSeconds = Math.floor((openAt.getTime() - now) / SECOND_MS)
  if (remainingSeconds <= 0) return null

  return (
    <div className="mt-8" role="timer" aria-label="Laikas iki atidarymo">
      <p className="label-mono text-paper/70">Atidarome už</p>
      <div className="mt-3 grid max-w-md grid-cols-4 gap-3">
        {getParts(remainingSeconds).map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border-2 border-paper/30 bg-ink/40 px-2 py-3 text-center"
          >
            <span className="heading-display text-d-sm block text-brand-yellow tabular-nums">
              {String(value).padStart(2, "0")}
            </span>
            <span className="label-mono mt-1 block text-[10px] text-paper/70">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
