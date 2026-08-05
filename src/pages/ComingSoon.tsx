import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { Seo } from "@/components/Seo"

function AccessUnlock({ onUnlock }: { onUnlock: (code: string) => boolean }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="label-mono text-paper/70 underline decoration-dotted underline-offset-4 transition-colors hover:text-paper"
      >
        Turi prieigos kodą?
      </button>
    )
  }

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        if (!onUnlock(code)) setError(true)
      }}
      className="flex items-center gap-2"
    >
      <input
        type="password"
        autoFocus
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setError(false)
        }}
        placeholder="Prieigos kodas"
        className="w-40 rounded-full border-2 border-ink/20 bg-paper px-4 py-2 font-mono text-[13px] text-ink outline-none focus:border-ink"
      />
      <button
        type="submit"
        className="brick-hover-sm rounded-full border-2 border-ink bg-ink px-4 py-2 font-mono text-[12px] font-bold tracking-[.1em] text-paper uppercase"
      >
        OK
      </button>
      {error && (
        <span className="font-mono text-[12px] text-red-500">
          Neteisingas kodas
        </span>
      )}
    </form>
  )
}

export default function ComingSoon({
  onUnlock,
}: {
  onUnlock: (code: string) => boolean
}) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setStatus("loading")
    const { error } = await supabase
      .from("coming_soon_subscribers")
      .insert({ email: trimmed })

    if (error && error.code !== "23505") {
      setStatus("error")
      return
    }
    setStatus("done")
  }

  return (
    <div className="studs-indigo relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <Seo
        title="Brick Time – LEGO® rinkinių prenumerata netrukus"
        description="Brick Time – LEGO® rinkinių prenumeratos paslauga Lietuvoje. Prisiregistruok ir sužinok pirmas, kai atidarysime."
        path="/"
      />
      <div className="grid-overlay pointer-events-none absolute inset-0" />

      <div className="relative z-10 mb-10 flex items-center">
        <video
          src="/nav-logo.mov"
          autoPlay
          loop
          muted
          playsInline
          className="h-16 w-auto rounded-xl object-contain"
        />
      </div>

      <div className="brick-card relative z-10 flex w-full max-w-lg flex-col items-center gap-6 bg-paper p-8 text-center md:p-11">
        <span className="label-mono rounded-full border-2 border-ink bg-brand-yellow px-3 py-1 text-ink">
          Netrukus
        </span>

        <h1 className="heading-display text-d-lg text-ink">
          BRICKTIME <span className="text-brand-indigo">startuoja</span> greitai
        </h1>

        <p className="max-w-sm text-[16px] leading-relaxed text-ink/70">
          Ruošiame LEGO® rinkinių nuomos platformą — pasirink mėnesinį biudžetą,
          sukeisk rinkinius, kai tik panorėsi. Palik el. paštą ir būsi pirmas,
          kai atidarysime duris.
        </p>

        {status === "done" ? (
          <div className="w-full rounded-2xl border-2 border-ink bg-[#5DDB9C] p-5">
            <p className="font-mono text-[13px] font-bold text-ink">
              ✓ Ačiū! Pranešime, kai startuosime.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tavo@example.com"
              className="flex-1 rounded-full border-2 border-ink/20 bg-paper px-5 py-3 font-mono text-[14px] text-ink outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="brick-hover-sm rounded-full border-2 border-ink bg-brand-indigo px-6 py-3 font-mono text-[13px] font-bold tracking-[.1em] text-paper uppercase disabled:opacity-50"
            >
              {status === "loading" ? "Siunčiama…" : "Pranešk man"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="font-mono text-[12px] text-red-500">
            Nepavyko užregistruoti. Bandyk dar kartą.
          </p>
        )}
      </div>

      <div className="relative z-10 mt-10">
        <AccessUnlock onUnlock={onUnlock} />
      </div>
    </div>
  )
}
