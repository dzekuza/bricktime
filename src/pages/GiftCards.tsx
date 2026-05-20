import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const DENOMINATIONS = [
  { amount: 20, cents: 2000, tagline: 'Puikus pradžiamokslis' },
  { amount: 30, cents: 3000, tagline: 'Mažam kolekcionieriui' },
  { amount: 50, cents: 5000, tagline: 'Solidus pasirinkimas' },
  { amount: 80, cents: 8000, tagline: 'Dideliam džiaugsmui' },
  { amount: 100, cents: 10000, tagline: 'Premium dovana' },
  { amount: 200, cents: 20000, tagline: 'Legende lygio dovana' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border-2 border-ink/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[.1em] text-ink/50 transition-all hover:border-ink hover:text-ink"
    >
      {copied ? '✓ Nukopijuota' : 'Kopijuoti'}
    </button>
  )
}

function SuccessBanner({ code, recipientEmail }: { code: string; recipientEmail: string }) {
  return (
    <div className="brick-card flex flex-col gap-5 bg-brand-mint p-6 md:p-9">
      <div>
        <p className="label-mono mb-3 text-ink/60">Dovanų kortelė išsiųsta</p>
        <h2 className="heading-display text-d-md text-ink">✓ Mokėjimas gautas!</h2>
      </div>
      <p className="text-[16px] leading-relaxed text-ink/70">
        Dovanų kortelė skirta <strong className="text-ink">{recipientEmail}</strong>.
        Kodą pateik gavėjui — jis gali jį panaudoti užsisakydamas prenumeratą ar merch.
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
        Galioja 1 metus nuo šiandienos. Kortelė taip pat išsiųsta gavėjui el. paštu.
      </p>
    </div>
  )
}

export default function GiftCards() {
  const [searchParams] = useSearchParams()
  const paymentSuccess = searchParams.get('payment') === 'success'
  const successCode = searchParams.get('code') ?? ''
  const recipientEmailFromUrl = searchParams.get('recipient') ?? ''

  const [selected, setSelected] = useState<number | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleBuy() {
    if (selected === null || !recipientEmail || !buyerEmail) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail) || !emailRegex.test(buyerEmail)) {
      setFormError('Įvesk teisingus el. pašto adresus.')
      return
    }
    setFormError('')
    setLoading(true)

    const denom = DENOMINATIONS.find((d) => d.cents === selected)
    if (!denom) { setLoading(false); return }

    const origin = window.location.origin
    const successUrl = `${origin}/gift-cards?payment=success&code={CODE}&session={SESSION_ID}&recipient=${encodeURIComponent(recipientEmail)}`
    const cancelUrl = `${origin}/gift-cards`

    const { data, error } = await supabase.functions.invoke('create-gift-card-checkout', {
      body: {
        amountCents: selected,
        recipientEmail,
        buyerEmail,
        message: message.trim() || null,
        successUrl,
        cancelUrl,
      },
    })

    setLoading(false)

    if (error || !data?.url) {
      setFormError('Klaida kuriant mokėjimą. Bandyk dar kartą.')
      return
    }

    window.location.href = data.url
  }

  const selectedDenom = DENOMINATIONS.find((d) => d.cents === selected)

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-paper py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div className="brick-card flex md:min-h-[320px] flex-col justify-between bg-ink p-6 md:p-9">
            <div className="label-mono mb-6 flex items-center gap-2.5">
              <Link to="/" className="text-paper/50 transition-colors hover:text-paper">
                BRICKTIME
              </Link>
              <span className="text-paper/30">/</span>
              <span className="text-paper/50">Dovanų kortelės</span>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <h1 className="heading-display text-d-xl max-w-[18ch] tracking-[-0.015em] text-paper">
                DOVANK{' '}
                <span className="inline-block text-brand-yellow italic skew-x-[-8deg]">
                  LEGO džiaugsmą.
                </span>
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-paper/70">
                Dovanos kortelę galima panaudoti užsisakant prenumeratą arba įsigyjant merch.
                Galioja vienerius metus.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-12 pt-4 md:pb-24">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">

          {/* Success state */}
          {paymentSuccess && successCode ? (
            <div className="mb-10">
              <SuccessBanner code={successCode} recipientEmail={recipientEmailFromUrl} />
            </div>
          ) : null}

          {!paymentSuccess && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              {/* Left — denomination picker */}
              <div>
                <span className="label-mono mb-5 inline-block text-ink/50">Pasirink sumą</span>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {DENOMINATIONS.map((d) => {
                    const isSelected = selected === d.cents
                    return (
                      <button
                        key={d.cents}
                        onClick={() => setSelected(d.cents)}
                        className={[
                          'brick-card flex flex-col gap-2 p-5 text-left transition-all',
                          isSelected
                            ? 'bg-ink text-paper shadow-[6px_6px_0_#001B21] -translate-x-[3px] -translate-y-[3px]'
                            : 'bg-paper brick-card-hover',
                        ].join(' ')}
                      >
                        <span className={`font-display text-[32px] font-bold uppercase leading-none ${isSelected ? 'text-paper' : 'text-ink'}`}>
                          €{d.amount}
                        </span>
                        <span className={`font-mono text-[11px] leading-snug ${isSelected ? 'text-paper/60' : 'text-ink/40'}`}>
                          {d.tagline}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right — purchase form */}
              <div>
                {selected !== null ? (
                  <div className="brick-card bg-paper p-6 md:p-9">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="heading-display text-d-sm text-ink">
                        €{selectedDenom?.amount} dovanų kortelė
                      </span>
                      <button
                        onClick={() => setSelected(null)}
                        className="label-mono ml-auto text-ink/30 transition-colors hover:text-ink"
                      >
                        Keisti
                      </button>
                    </div>

                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="label-mono text-ink/50">
                          Gavėjo el. paštas <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="gavėjas@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="label-mono text-ink/50">
                          Asmeninis sveikinimas (neprivaloma)
                        </label>
                        <textarea
                          placeholder="Linkiu nuostabios kelionės su LEGO!"
                          value={message}
                          onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                          rows={3}
                          className="resize-none rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                        />
                        <span className="label-mono text-right text-ink/30">
                          {message.length}/140
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="label-mono text-ink/50">
                          Tavo el. paštas (kvitui) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="tavo@example.com"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          className="rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                        />
                      </div>

                      {formError && (
                        <p className="font-mono text-[12px] text-red-500">{formError}</p>
                      )}

                      <button
                        disabled={!recipientEmail || !buyerEmail || loading}
                        onClick={handleBuy}
                        className="rounded-xl border-2 border-ink bg-ink py-4 font-mono text-[14px] font-bold uppercase tracking-[.08em] text-paper transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#001B21] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {loading ? 'Kraunama…' : `Pirkti €${selectedDenom?.amount} dovanų kortelę →`}
                      </button>

                      <p className="font-mono text-[11px] text-ink/35">
                        Mokėjimas apdorojamas saugiai per Stripe. Kortelė galioja 1 metus.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="brick-card flex min-h-[200px] flex-col items-center justify-center gap-3 bg-paper p-8 text-center">
                    <span className="font-display text-[48px] leading-none text-ink/10">€</span>
                    <p className="label-mono text-ink/30">Pasirink sumą kairėje</p>
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
