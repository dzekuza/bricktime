import { useState, type FormEvent } from "react"
import { CheckIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function WaitlistForm() {
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

    const { error: omnisendError } = await supabase.functions.invoke(
      "omnisend-subscribe",
      { body: { email: trimmed } }
    )
    if (omnisendError) {
      console.error("Failed to subscribe to Omnisend:", omnisendError)
    }

    setStatus("done")
  }

  return (
    <div className="brick-card flex w-full flex-col gap-6 bg-paper p-6 md:p-10">
      <div>
        <p className="label-mono text-ink/40">Startas jau netrukus</p>
        <h2 className="heading-display text-d-sm mt-2 text-ink">
          Sužinok pirmas
        </h2>
        <p className="mt-3 max-w-[44ch] text-[16px] leading-relaxed text-ink/70">
          Palik savo el. paštą ir pirmasis sužinok apie BRICKTIME startą.
        </p>
      </div>

      {status === "done" ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-brand-mint p-5"
        >
          <CheckIcon className="size-5 shrink-0 text-ink" />
          <p className="font-mono text-[13px] font-bold text-ink">
            Ačiū! Pranešime, kai startuosime.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="waitlist-email" className="label-mono text-ink/50">
            El. paštas
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tavo@example.com"
            className="h-12 rounded-full border-2 border-ink/20 bg-paper px-5 font-mono text-[14px] text-ink outline-none placeholder:text-ink/30 focus:border-ink"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="brick-hover-sm h-12 rounded-full border-2 border-ink bg-brand-indigo px-6 font-mono text-[13px] font-bold tracking-[.1em] text-paper uppercase disabled:opacity-50"
          >
            {status === "loading" ? "Siunčiama…" : "Pranešk man"}
          </button>
          {status === "error" && (
            <p role="alert" className="font-mono text-[12px] text-brand-orange">
              Nepavyko užregistruoti. Bandyk dar kartą.
            </p>
          )}
        </form>
      )}
    </div>
  )
}
