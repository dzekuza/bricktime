import { useState, type FormEvent } from "react"
import { Seo } from "@/components/Seo"
import BrandLogoVideo from "@/components/BrandLogoVideo"
import { WaitlistForm } from "@/components/coming-soon/WaitlistForm"

const STEPS = [
  "Pasirink prenumeratą",
  "Konstruok įspūdingus rinkinius",
  "Baigęs — keisk juos į kitus",
]

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
        <span className="font-mono text-[12px] text-brand-orange">
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
  return (
    <div className="studs-indigo relative min-h-[100dvh] overflow-hidden">
      <Seo
        title="Brick Time – LEGO® rinkinių prenumerata netrukus"
        description="Brick Time – LEGO® rinkinių prenumeratos paslauga Lietuvoje. Prisiregistruok ir sužinok pirmas, kai atidarysime."
        path="/"
      />
      <div className="grid-overlay pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1320px] flex-col px-4 py-8 md:px-7 md:py-12">
        <BrandLogoVideo className="h-14 w-auto self-start rounded-xl object-contain md:h-16" />

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <section>
            <span className="label-mono rounded-full border-2 border-ink bg-brand-yellow px-3 py-1 text-ink">
              Netrukus
            </span>
            <h1 className="heading-display text-d-xl mt-5 text-paper">
              BRICKTIME startuoja{" "}
              <span className="inline-block -rotate-1 border-2 border-ink bg-brand-yellow px-3 text-ink">
                greitai
              </span>
            </h1>
            <p className="mt-6 max-w-[44ch] text-[18px] leading-relaxed text-paper/80">
              Ruošiame pirmąją Lietuvoje LEGO® rinkinių prenumeratą.
            </p>
            <ol className="mt-8 max-w-md divide-y-2 divide-paper/20 border-y-2 border-paper/20">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-baseline gap-4 py-4">
                  <span className="label-mono text-paper/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[17px] font-bold text-paper">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <WaitlistForm />
        </main>

        <footer>
          <AccessUnlock onUnlock={onUnlock} />
        </footer>
      </div>
    </div>
  )
}
