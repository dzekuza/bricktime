import { useState } from "react"
import { supabase } from "@/lib/supabase"

export function AuthForm({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "register" | "forgot">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)
      if (error) setError(error.message)
      else onClose()
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nustatyti-slaptazodi`,
      })
      setLoading(false)
      if (error) setError(error.message)
      else setSuccess("Nuoroda slaptažodžiui atstatyti išsiųsta į el. paštą.")
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (!error && data.user) {
        await supabase.from("subscribers").upsert({
          id: data.user.id,
          name: name || email.split("@")[0],
          email,
          avatar_id: Math.floor(Math.random() * 5),
          avatar_bg: ["#FFD731", "#FB4903", "#4DA2FF", "#5DDB9C", "#FFAEE7"][
            Math.floor(Math.random() * 5)
          ],
        })
      }
      setLoading(false)
      if (error) setError(error.message)
      else {
        setSuccess("Paskyra sukurta! Patikrink el. paštą arba prisijunk.")
        setMode("signin")
      }
    }
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-1">
        <p className="font-mono text-[12px] text-ink/60">
          Įvesk el. paštą – atsiųsime nuorodą naujam slaptažodžiui susikurti.
        </p>
        <input
          type="email"
          placeholder="El. paštas"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink transition-colors outline-none focus:border-ink"
        />

        {error && <p className="font-mono text-[11px] text-red-500">{error}</p>}
        {success && (
          <p className="font-mono text-[11px] text-green-600">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border-2 border-ink bg-ink py-2 font-mono text-[12px] font-bold text-paper transition-all hover:opacity-80 disabled:opacity-40"
        >
          {loading ? "…" : "Siųsti nuorodą"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signin")
            setError("")
            setSuccess("")
          }}
          className="font-mono text-[11px] text-ink/40 transition-colors hover:text-ink"
        >
          ← Grįžti į prisijungimą
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-1">
      <div className="flex overflow-hidden rounded-xl border-2 border-ink/15">
        {(["signin", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setError("")
              setSuccess("")
            }}
            className={`flex-1 py-1.5 font-mono text-[11px] font-bold transition-colors ${mode === m ? "bg-ink text-paper" : "text-ink/40 hover:text-ink"}`}
          >
            {m === "signin" ? "Prisijungti" : "Registruotis"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateRows: mode === "register" ? "1fr" : "0fr",
          opacity: mode === "register" ? 1 : 0,
          transition: "grid-template-rows 0.2s ease-out, opacity 0.2s ease-out",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <input
            type="text"
            placeholder="Vardas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={mode === "register"}
            className="mb-0 w-full rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink transition-colors outline-none focus:border-ink"
          />
        </div>
      </div>
      <input
        type="email"
        placeholder="El. paštas"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink transition-colors outline-none focus:border-ink"
      />
      <input
        type="password"
        placeholder="Slaptažodis"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-[13px] text-ink transition-colors outline-none focus:border-ink"
      />
      {mode === "signin" && (
        <button
          type="button"
          onClick={() => {
            setMode("forgot")
            setError("")
            setSuccess("")
          }}
          className="-mt-1 self-end font-mono text-[11px] text-ink/40 transition-colors hover:text-ink"
        >
          Pamiršai slaptažodį?
        </button>
      )}

      {error && <p className="font-mono text-[11px] text-red-500">{error}</p>}
      {success && (
        <p className="font-mono text-[11px] text-green-600">{success}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl border-2 border-ink bg-ink py-2 font-mono text-[12px] font-bold text-paper transition-all hover:opacity-80 disabled:opacity-40"
      >
        {loading ? "…" : mode === "signin" ? "Prisijungti" : "Sukurti paskyrą"}
      </button>
    </form>
  )
}
