import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import Breadcrumb from "@/components/Breadcrumb"
import {
  MenuIcon,
  XIcon,
  ArrowRightIcon,
  UserIcon,
  InfoIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { avatarSrc } from "@/lib/avatars"
import { AuthForm } from "@/components/AuthForm"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useCredits } from "@/hooks/useCredits"

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  nano: { bg: "#F5F1EB", text: "#001B21" },
  mini: { bg: "#FFAEE7", text: "#001B21" },
  standard: { bg: "#FFD731", text: "#001B21" },
  pro: { bg: "#4DA2FF", text: "#001B21" },
  mega: { bg: "#FB4903", text: "#F5F1EB" },
  mystery_s: { bg: "#FFD731", text: "#001B21" },
  mystery_m: { bg: "#FB4903", text: "#F5F1EB" },
}

const links = [
  { label: "Rinkiniai", to: "/archive" },
  { label: "Merch", to: "/merch" },
  { label: "Dovanų kuponas", to: "/gift-cards" },
  { label: "Bendruomenė", to: "/community" },
]

// ── Avatar button ─────────────────────────────────────────────────────────────

function AvatarPopover() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)

  const avatarId = profile?.avatarId ?? 0
  const avatarBg = profile?.avatarBg ?? "#FFD731"

  if (user) {
    return (
      <Link
        to="/account"
        className="brick-hover-sm relative z-10 flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink"
        style={{ background: avatarBg }}
        aria-label="Paskyra"
      >
        <img
          src={avatarSrc(avatarId)}
          alt="Paskyra"
          className="h-full w-full object-cover"
        />
      </Link>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="brick-hover-sm relative z-10 flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink"
          style={{ background: avatarBg }}
          aria-label="Prisijungti"
        >
          <UserIcon className="size-4 text-ink" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[6px_6px_0_#001B21]"
        style={{
          transformOrigin: "var(--radix-popover-content-transform-origin)",
        }}
      >
        <AuthForm onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// ── Plan chip (shown when subscribed) ────────────────────────────────────────

function PlanChip({ plan }: { plan: string }) {
  const { subscriptions } = useSubscriptions()
  const dbPlan = subscriptions.find((p) => p.id === plan)
  const bg = dbPlan?.bg_color ?? PLAN_COLORS[plan]?.bg ?? "#F5F1EB"
  const text = dbPlan?.text_color ?? PLAN_COLORS[plan]?.text ?? "#001B21"
  const name = dbPlan?.name ?? plan.charAt(0).toUpperCase() + plan.slice(1)

  return (
    <Link
      to="/account"
      className="-mr-7 hidden items-center rounded-full border-2 border-ink py-[7px] pr-9 pl-3.5 md:flex"
      style={{ background: bg }}
    >
      <span
        className="font-mono text-[11px] font-bold tracking-[.12em] uppercase"
        style={{ color: text }}
      >
        {name}
      </span>
    </Link>
  )
}

// ── Credits pill (shown when subscribed) ─────────────────────────────────────

function CreditsPill() {
  const { remainingCredits, loading } = useCredits()
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <div className="mr-2 hidden items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3.5 py-[7px] md:flex">
        <span className="font-mono text-[11px] font-bold tracking-[.12em] text-ink uppercase">
          {loading ? "…" : `${remainingCredits} Kr.`}
        </span>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          aria-label="Kas yra Briksiai?"
          className="flex items-center text-ink/40 transition-colors hover:text-ink"
        >
          <InfoIcon size={13} strokeWidth={2.5} />
        </button>
      </div>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-sm rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_#001B21]">
          <DialogHeader>
            <DialogTitle className="heading-display text-d-xs text-ink">
              Kas yra Briksiai?
            </DialogTitle>
          </DialogHeader>
          <p className="text-[14px] leading-relaxed text-ink/70">
            Briksiai – tai Brick Time taškų valiuta. Juos gaunate su savo
            prenumerata, o jų kiekis priklauso nuo pasirinkto plano. Kiekvienas
            LEGO® rinkinys turi savo Briksių vertę, todėl pagal sukauptus
            Briksius lengvai matysite, kuriuos rinkinius galite pasirinkti.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

export default function Nav() {
  const { pathname } = useLocation()
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-50 bg-transparent py-4 md:py-6">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div
            className={[
              "flex h-[84px] items-center justify-between rounded-[28px] border-2 border-ink bg-paper px-7 transition-all duration-300 md:grid md:grid-cols-[1fr_auto_1fr]",
              scrolled ? "shadow-[6px_6px_0_#001B21]" : "shadow-none",
            ].join(" ")}
          >
            {/* Left — desktop nav links */}
            <div className="hidden items-center gap-7 md:flex">
              {links.map((l) => {
                const isActive =
                  l.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(l.to.split("#")[0]) && l.to !== "/"
                return (
                  <Link
                    key={l.label}
                    to={l.to}
                    className={`relative text-[15px] font-semibold text-ink after:absolute after:right-0 after:-bottom-1.5 after:left-0 after:h-[2px] after:origin-left after:bg-ink after:transition-transform after:duration-200 after:content-[''] ${isActive ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"}`}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </div>

            <Link to="/" className="flex items-center md:justify-self-center">
              <video
                src="/nav-logo.mov"
                autoPlay
                loop
                muted
                playsInline
                className="h-16 w-auto object-contain"
              />
            </Link>

            {/* Right — CTA + avatar + hamburger */}
            <div className="flex items-center justify-end gap-7">
              <Link
                to="/subscribe"
                className={`relative hidden text-[15px] font-semibold text-ink after:absolute after:right-0 after:-bottom-1.5 after:left-0 after:h-[2px] after:origin-left after:bg-ink after:transition-transform after:duration-200 after:content-[''] md:flex ${pathname.startsWith("/subscribe") ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"}`}
              >
                Prenumeratos
              </Link>
              <div className="flex items-center">
                {user && profile?.plan ? (
                  <>
                    <CreditsPill />
                    <PlanChip plan={profile.plan} />
                  </>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="brick-hover-sm mr-3 hidden rounded-full border-2 border-ink bg-ink font-bold text-paper md:inline-flex"
                  >
                    <Link to="/subscribe">
                      Pradėk konstruoti{" "}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                )}
                <AvatarPopover />
              </div>

              <button
                onClick={() => setOpen((v) => !v)}
                className="grid size-10 place-items-center rounded-full border-2 border-ink bg-paper md:hidden"
                aria-label={open ? "Uždaryti meniu" : "Atidaryti meniu"}
              >
                {open ? (
                  <XIcon className="size-5 text-ink" />
                ) : (
                  <MenuIcon className="size-5 text-ink" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Breadcrumb />

      {/* Mobile drawer */}
      <div
        className="fixed right-0 bottom-0 left-0 z-40 flex flex-col border-t border-ink/10 bg-paper/95 backdrop-blur-lg md:hidden"
        style={{
          top: "96px",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <div className="flex h-full flex-col justify-between gap-4 p-5">
          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {links.map((l, i) => {
              const isActive =
                l.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(l.to.split("#")[0]) && l.to !== "/"
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] font-semibold text-ink transition-colors hover:bg-ink/5 ${isActive ? "bg-ink/5" : ""}`}
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "translateY(0)" : "translateY(-6px)",
                    transition: `opacity 0.18s ease ${i * 30}ms, transform 0.18s ease ${i * 30}ms`,
                  }}
                >
                  {l.label}
                  {isActive && (
                    <span className="size-2 rounded-full border-2 border-ink bg-brand-yellow" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* CTA */}
          {!(user && profile?.plan) && (
            <Link
              to="/subscribe"
              onClick={() => setOpen(false)}
              className="brick-hover-sm flex w-full items-center justify-center rounded-full border-2 border-ink bg-ink py-3.5 text-center text-[15px] font-bold text-paper"
              style={{
                opacity: open ? 1 : 0,
                transition: "opacity 0.2s ease 120ms",
              }}
            >
              Pradėk konstruoti{" "}
              <ArrowRightIcon className="ml-1 inline size-4" />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
