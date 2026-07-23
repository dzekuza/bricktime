import { useState } from "react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { useSearchParams, useNavigate } from "react-router-dom"

const DENOMINATIONS = [
  { amount: 20, cents: 2000, tagline: "Puiki pradžia" },
  { amount: 30, cents: 3000, tagline: "Mažam kolekcininkui" },
  { amount: 50, cents: 5000, tagline: "Solidi dovana" },
  { amount: 80, cents: 8000, tagline: "Didesniam džiaugsmui" },
  { amount: 100, cents: 10000, tagline: "Premium dovana" },
  { amount: 200, cents: 20000, tagline: "Svajonių dovana" },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      className="rounded-lg border-2 border-ink/30 px-3 py-1 font-mono text-[11px] font-bold tracking-[.1em] text-ink/50 uppercase transition-all hover:border-ink hover:text-ink"
    >
      {copied ? "✓ Nukopijuota" : "Kopijuoti"}
    </button>
  )
}

function SuccessBanner({
  code,
  recipientEmail,
}: {
  code: string
  recipientEmail: string
}) {
  return (
    <div className="brick-card flex flex-col gap-5 bg-[#5DDB9C] p-6 md:p-9">
      <div>
        <p className="label-mono mb-3 text-ink/60">Dovanų kortelė išsiųsta</p>
        <h2 className="heading-display text-d-md text-ink">
          ✓ Mokėjimas gautas!
        </h2>
      </div>
      <p className="text-[16px] leading-relaxed text-ink/70">
        Dovanų kortelė skirta{" "}
        <strong className="text-ink">{recipientEmail}</strong>. Kodą pateik
        gavėjui — jis gali jį panaudoti užsisakydamas prenumeratą ar merch.
      </p>
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-paper p-5">
        <p className="label-mono text-ink/50">Dovanų kortelės kodas</p>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[28px] font-bold tracking-[.12em] text-ink md:text-[36px]">
            {code}
          </span>
          <CopyButton text={code} />
        </div>
      </div>
      <p className="font-mono text-[12px] text-ink/50">
        Galioja 1 metus nuo šiandienos. Kortelė taip pat išsiųsta gavėjui el.
        paštu.
      </p>
    </div>
  )
}

export default function GiftCards() {
  const [searchParams] = useSearchParams()
  const paymentSuccess = searchParams.get("payment") === "success"
  const successCode = searchParams.get("code") ?? ""
  const recipientEmailFromUrl = searchParams.get("recipient") ?? ""

  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [message, setMessage] = useState("")
  const [formError, setFormError] = useState("")

  function handleBuy() {
    if (selected === null || !recipientEmail || !buyerEmail) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail) || !emailRegex.test(buyerEmail)) {
      setFormError("Įvesk teisingus el. pašto adresus.")
      return
    }
    setFormError("")
    const params = new URLSearchParams({
      type: "giftcard",
      amount: String(selected),
      recipient: recipientEmail,
      buyer: buyerEmail,
      ...(message.trim() ? { message: message.trim() } : {}),
    })
    navigate(`/checkout?${params.toString()}`)
  }

  const selectedDenom = DENOMINATIONS.find((d) => d.cents === selected)

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="heading-display text-d-xl tracking-[-0.015em] text-ink">
                DOVANK{" "}
                <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                  džiaugsmą.
                </span>
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                Padovanok galimybę atrasti naujus LEGO® rinkinius, mėgautis
                konstravimo procesu ir patirti džiaugsmą kuriant – dovana, kuri
                įsimena.
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/build-spaceship.jpg"
                alt="LEGO dovanų kortelė"
                className="aspect-[2/1] w-full rounded-2xl border-2 border-ink object-cover shadow-[6px_6px_0_#001B21]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main section */}
      <section className="bg-paper pt-6 pb-16 md:pb-28">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          {paymentSuccess && successCode ? (
            <SuccessBanner
              code={successCode}
              recipientEmail={recipientEmailFromUrl}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
              {/* Left — amount picker */}
              <div className="flex flex-col gap-5">
                <span className="label-mono text-ink/50">Pasirink sumą</span>
                <div className="grid grid-cols-2 gap-3">
                  {DENOMINATIONS.map((d) => {
                    const isSelected = selected === d.cents
                    return (
                      <button
                        key={d.cents}
                        onClick={() => setSelected(d.cents)}
                        className={[
                          "flex w-[180px] flex-col gap-2 rounded-[35px] border-2 border-ink p-[22px] text-left transition-all md:w-[200px]",
                          isSelected
                            ? "-translate-x-[3px] -translate-y-[3px] bg-ink shadow-[6px_6px_0_#001B21]"
                            : "bg-paper shadow-[6px_6px_0_#001B21] hover:-translate-x-[3px] hover:-translate-y-[3px]",
                        ].join(" ")}
                      >
                        <span
                          className={`font-display text-[32px] leading-[1] font-extrabold uppercase ${isSelected ? "text-paper" : "text-ink"}`}
                        >
                          €{d.amount}
                        </span>
                        <span
                          className={`font-mono text-[11px] leading-snug ${isSelected ? "text-paper/60" : "text-ink/40"}`}
                        >
                          {d.tagline}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right — form */}
              <div>
                {selected !== null ? (
                  <div className="rounded-[35px] border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_#001B21] md:p-[38px]">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="heading-display text-d-sm tracking-[-0.01em] text-ink">
                        €{selectedDenom?.amount} dovanų kortelė
                      </h2>
                      <button
                        onClick={() => setSelected(null)}
                        className="label-mono text-ink/30 transition-colors hover:text-ink"
                      >
                        Keisti
                      </button>
                    </div>

                    <div className="flex flex-col gap-5">
                      {/* Recipient email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="label-mono text-ink/50">
                          Gavėjo el. paštas{" "}
                          <span className="text-[#ff6467]">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="gavėjas@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="rounded-[22px] border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink transition-colors outline-none focus:border-ink"
                        />
                      </div>

                      {/* Personal message */}
                      <div className="flex flex-col gap-1.5">
                        <label className="label-mono text-ink/50">
                          Asmeninis sveikinimas (neprivaloma)
                        </label>
                        <textarea
                          placeholder="Linkiu nuostabios kelionės su LEGO!"
                          value={message}
                          onChange={(e) =>
                            setMessage(e.target.value.slice(0, 140))
                          }
                          rows={3}
                          className="resize-none rounded-[22px] border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink transition-colors outline-none focus:border-ink"
                        />
                        <span className="label-mono text-right text-ink/30">
                          {message.length}/140
                        </span>
                      </div>

                      {/* Buyer email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="label-mono text-ink/50">
                          Tavo el. paštas (kvitui){" "}
                          <span className="text-[#ff6467]">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="tavo@example.com"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          className="rounded-[22px] border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink transition-colors outline-none focus:border-ink"
                        />
                      </div>

                      {formError && (
                        <p className="font-mono text-[12px] text-red-500">
                          {formError}
                        </p>
                      )}

                      {/* Submit */}
                      <button
                        disabled={!recipientEmail || !buyerEmail}
                        onClick={handleBuy}
                        className="rounded-[22px] border-2 border-ink bg-ink py-4 font-mono text-[14px] font-bold tracking-[.08em] text-paper uppercase transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#001B21] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Tęsti →
                      </button>

                      <p className="font-mono text-[11px] text-ink/35">
                        Mokėjimas apdorojamas saugiai per Stripe. Kortelė
                        galioja 1 metus.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[35px] border-2 border-ink/15 bg-paper p-8 text-center">
                    <span className="font-display text-[64px] leading-none text-ink/10">
                      €
                    </span>
                    <p className="label-mono text-ink/30">
                      Pasirink sumą kairėje
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
