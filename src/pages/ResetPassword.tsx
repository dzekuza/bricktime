import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { supabase } from "@/lib/supabase"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Slaptažodžiai nesutampa.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate("/account"), 1500)
    }
  }

  return (
    <>
      <Seo
        title="Nustatyti naują slaptažodį"
        description="Susikurk naują Brick Time paskyros slaptažodį."
        path="/nustatyti-slaptazodi"
        noindex
      />
      <Nav />
      <main className="bg-paper text-ink">
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-[420px] px-4 md:px-7">
            <p className="label-mono text-ink/40">Paskyra</p>
            <h1 className="heading-display text-d-lg mt-4 text-ink">
              Naujas slaptažodis
            </h1>

            {success ? (
              <p className="mt-6 font-mono text-[13px] text-green-600">
                Slaptažodis atnaujintas. Nukreipiame į paskyrą…
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 flex flex-col gap-3"
              >
                <input
                  type="password"
                  placeholder="Naujas slaptažodis"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink transition-colors outline-none focus:border-ink"
                />
                <input
                  type="password"
                  placeholder="Pakartok slaptažodį"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink transition-colors outline-none focus:border-ink"
                />

                {error && (
                  <p className="font-mono text-[11px] text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl border-2 border-ink bg-ink py-2 font-mono text-[12px] font-bold text-paper transition-all hover:opacity-80 disabled:opacity-40"
                >
                  {loading ? "…" : "Išsaugoti slaptažodį"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
