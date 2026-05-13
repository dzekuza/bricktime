import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CalendarXIcon,
  RefreshCcwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReveal } from "@/hooks/useReveal"
import {
  getPlanBrickImage,
  getPlanDisplayName,
  getPlanTheme,
} from "@/lib/plan-branding"

const nanoTheme = getPlanTheme("nano")!
const miniTheme = getPlanTheme("mini")!
const standardTheme = getPlanTheme("standard")!
const proTheme = getPlanTheme("pro")!
const megaTheme = getPlanTheme("mega")!

// ── data ───────────────────────────────────────────────────────────────────

const plans = [
  {
    key: "nano",
    name: getPlanDisplayName("nano"),
    brickImage: getPlanBrickImage("nano"),
    tagline: "Išbandyk vieną produktą.",
    monthlyPrice: 9,
    annualPrice: 7,
    ...nanoTheme,
    featured: false,
    perks: [
      { label: "Iki €50 vertės produktai vienu metu", included: true },
      { label: "Surinkimo kortelė", included: true },
      { label: "4 vinilo lipdukai", included: true },
      { label: "Nemokamas standartinis pristatymas", included: true },
      { label: "Išskirtinis miniukas", included: false },
      { label: "Keitimų klubo prieiga", included: false },
      { label: "Ankstyva prieiga prie produktų", included: false },
      { label: "Metinė staigmenos dėžutė", included: false },
    ],
    simplifiedPerks: [
      "Iki €50 vertės produktai",
      "Surinkimo kortelė",
      "4 lipdukų",
      "Nemokamas pristatymas",
    ],
  },
  {
    key: "mini",
    name: getPlanDisplayName("mini"),
    brickImage: getPlanBrickImage("mini"),
    tagline: "Pilnas patyrimas.",
    monthlyPrice: 14,
    annualPrice: 11,
    ...miniTheme,
    featured: false,
    perks: [
      { label: "Iki €100 vertės produktai vienu metu", included: true },
      { label: "1 išskirtinis miniukas", included: true },
      { label: "Surinkimo kortelė + 8 vinilo lipdukai", included: true },
      { label: "Nemokamas standartinis pristatymas", included: true },
      { label: "Keitimų klubo prieiga", included: false },
      { label: "Ankstyva prieiga prie produktų", included: false },
      { label: "Metinė staigmenos dėžutė", included: false },
    ],
    simplifiedPerks: [
      "Iki €100 vertės produktai",
      "1 išskirtinis miniukas",
      "Surinkimo kortelė + 8 lipdukų",
      "Nemokamas pristatymas",
    ],
  },
  {
    key: "standard",
    name: getPlanDisplayName("standard"),
    brickImage: getPlanBrickImage("standard"),
    tagline: "Mėgėjų pasirinkimas.",
    monthlyPrice: 24,
    annualPrice: 19,
    ...standardTheme,
    featured: true,
    perks: [
      { label: "Iki €200 vertės produktai vienu metu", included: true },
      { label: "2 išskirtiniai miniukai", included: true },
      { label: "16 vinilo lipdukų", included: true },
      { label: "Keitimų klubo prieiga", included: true },
      { label: "Skubus pristatymas", included: true },
      { label: "Ankstyva prieiga prie produktų", included: false },
      { label: "Metinė staigmenos dėžutė", included: false },
    ],
    simplifiedPerks: [
      "Iki €200 vertės produktai",
      "2 išskirtiniai miniukai",
      "16 lipdukų",
      "Keitimų klubo prieiga",
      "Skubus pristatymas",
    ],
  },
  {
    key: "pro",
    name: getPlanDisplayName("pro"),
    brickImage: getPlanBrickImage("pro"),
    tagline: "Rimtiems statytojams.",
    monthlyPrice: 35,
    annualPrice: 28,
    ...proTheme,
    featured: false,
    perks: [
      { label: "Iki €350 vertės produktai vienu metu", included: true },
      { label: "2 miniukai + alt spalva", included: true },
      { label: "20 vinilo lipdukų", included: true },
      { label: "Keitimų klubo prieiga", included: true },
      { label: "Ankstyva prieiga prie produktų", included: true },
      { label: "Skubus pristatymas", included: true },
      { label: "Metinė staigmenos dėžutė", included: false },
    ],
    simplifiedPerks: [
      "Iki €350 vertės produktai",
      "2 miniukai + alt spalva",
      "20 lipdukų",
      "Ankstyva prieiga prie produktų",
      "Skubus pristatymas",
    ],
  },
  {
    key: "mega",
    name: getPlanDisplayName("mega"),
    brickImage: getPlanBrickImage("mega"),
    tagline: "Visa visata.",
    monthlyPrice: 55,
    annualPrice: 44,
    ...megaTheme,
    featured: false,
    perks: [
      { label: "Iki €600 vertės produktai vienu metu", included: true },
      { label: "3 miniukai + retas variantas", included: true },
      { label: "Kietu viršeliu surinkimo knyga", included: true },
      { label: "Keitimų klubo prieiga", included: true },
      { label: "Ankstyva prieiga prie produktų", included: true },
      { label: "Metinė staigmenos dėžutė", included: true },
      { label: "Skubus pristatymas", included: true },
    ],
    simplifiedPerks: [
      "Iki €600 vertės produktai",
      "3 miniukai + retas variantas",
      "Kietu viršeliu surinkimo knyga",
      "Metinė staigmenos dėžutė",
      "Visiška prieiga",
    ],
  },
]

const planIndex: Record<string, number> = {
  nano: 0,
  mini: 1,
  standard: 2,
  pro: 3,
  mega: 4,
}

const comparisonRows = [
  {
    feature: "Mėnesinis biudžetas",
    nano: "€50",
    mini: "€100",
    standard: "€200",
    pro: "€350",
    mega: "€600",
  },
  {
    feature: "Išskirtiniai miniukai",
    nano: "—",
    mini: "1",
    standard: "2",
    pro: "2 + alt",
    mega: "3 + variantas",
  },
  {
    feature: "Surinkimo kortelė",
    nano: "✓",
    mini: "✓",
    standard: "✓",
    pro: "✓",
    mega: "Kieta knyga",
  },
  {
    feature: "Vinilo lipdukai",
    nano: "4",
    mini: "8",
    standard: "16",
    pro: "20",
    mega: "24",
  },
  {
    feature: "Pristatymas",
    nano: "Standartinis",
    mini: "Standartinis",
    standard: "Skubus",
    pro: "Skubus",
    mega: "Skubus",
  },
  {
    feature: "Keitimų klubo prieiga",
    nano: "—",
    mini: "—",
    standard: "✓",
    pro: "✓",
    mega: "✓",
  },
  {
    feature: "Ankstyva prieiga",
    nano: "—",
    mini: "—",
    standard: "—",
    pro: "✓",
    mega: "✓",
  },
  {
    feature: "Staigmenos dėžutė",
    nano: "—",
    mini: "—",
    standard: "—",
    pro: "—",
    mega: "✓",
  },
]

const trustTiles = [
  {
    label: "Atšauk bet kada",
    body: "Jokių mokesčių, jokio trinties. Vienas paspaudimas tavo paskyros skydelyje.",
    bg: "#5DDB9C",
    num: "01",
  },
  {
    label: "Praleisk bet kurį mėnesį",
    body: "Vyksti atostogų? Per metus galima praleisti iki 3 mėnesių, mokėjimas sustabdomas.",
    bg: "#FFAEE7",
    num: "02",
  },
  {
    label: "30 dienų garantija",
    body: "Nepatiko pirmasis mėnuo — grąžinsime visą sumą, be jokių klausimų.",
    bg: "#4DA2FF",
    num: "03",
  },
  {
    label: "Nemokamas pristatymas visame pasaulyje",
    body: "Standartinis visuose planuose. Skubus Advanced, Master ir Legend planuose.",
    bg: "#FFD731",
    num: "04",
  },
]

const faqs = [
  {
    q: "Kaip veikia mėnesinis biudžetas?",
    a: "Kiekvienas planas suteikia fiksuotą € biudžetą produktams iš katalogo. Galite turėti kelis produktus vienu metu, kol bendra jų vertė neviršija biudžeto. Biudžetas atsinaujina kas mėnesį.",
  },
  {
    q: "Ar galiu keisti planą prenumeratos metu?",
    a: "Taip — paaukštink arba sumažink planą bet kada iš savo skydelio. Pakeitimai įsigalioja nuo kito atsiskaitymo ciklo.",
  },
  {
    q: "Kokius mokėjimo būdus priimate?",
    a: "Priimame visas pagrindines kredito ir debeto korteles (Visa, Mastercard, Amex), PayPal ir Apple Pay.",
  },
  {
    q: "Kaip veikia metinio atsiskaitymo nuolaida?",
    a: "Metinis atsiskaitymas apmokestina už 10 mėnesių iš anksto ir suteikia 12 mėnesių produktų — iš esmės 2 mėnesiai nemokamai. Rodoma kaina yra mėnesio ekvivalentas.",
  },
  {
    q: "Ar miniukai suderinami su standartinėmis kaladėlėmis?",
    a: "Kiekviena BRICKTIME detalė yra 100 % suderinama su visomis pagrindinėmis kaladėlių sistemomis, kurias jau turi.",
  },
  {
    q: "Ar pristatote į užsienį?",
    a: "Pristatome į 42 šalis. Standartinis pristatymas nemokamas visur. Pristatymo laikas: 3–5 dienos (ES), 7–14 dienų (likęs pasaulis).",
  },
]

function FAQItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string
  a: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b-2 border-dashed border-ink/20 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[16px] leading-[1.4] font-semibold text-ink">
          {q}
        </span>
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink text-ink"
          style={{
            transition: "transform .2s",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className="overflow-hidden"
        style={{
          transition: "max-height .25s, opacity .2s",
          maxHeight: open ? 200 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <p className="pb-5 text-[15px] leading-[1.65] text-ink/65">{a}</p>
      </div>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

export default function Subscribe() {
  const [params] = useSearchParams()
  const initialPlan = planIndex[params.get("plan") ?? "standard"] ?? 2

  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [step, setStep] = useState<"plan" | "payment">("plan")
  const [form, setForm] = useState({
    email: "",
    card: "",
    expiry: "",
    cvc: "",
    name: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plan = plans[selectedPlan]
  const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice
  const total = billing === "monthly" ? price : price * 10

  const heroRef = useReveal<HTMLDivElement>()
  const compareRef = useReveal<HTMLDivElement>()
  const trustRef = useReveal<HTMLDivElement>()
  const faqRef = useReveal<HTMLDivElement>()

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper">
        <Nav />
        <section className="py-20">
          <div className="mx-auto max-w-[1320px] px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className="brick-card flex min-h-[420px] flex-col items-center justify-center p-16 text-center lg:col-span-12"
                style={{ background: "#5DDB9C" }}
              >
                <div
                  className="font-display text-[80px] leading-none"
                  style={{ color: "#001B21" }}
                >
                  ✓
                </div>
                <h1 className="heading-display text-d-lg mt-6 text-ink">
                  Tu klube.
                </h1>
                <p className="mt-5 max-w-[42ch] text-[17px] leading-[1.65] text-ink/70">
                  Sveiki BRICKTIME {plan.name}. Katalogas atidarytas — naršyk
                  produktus ir pasirink pagal savo {plan.name} biudžetą.
                  Patvirtinimas išsiųstas į{" "}
                  <b>{form.email || "jūsų el. paštą"}</b>.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <Button
                    asChild
                    className="brick-hover-sm rounded-full border-2 border-ink bg-ink text-[15px] font-bold text-paper"
                  >
                    <Link to="/account">
                      Eiti į paskyrą <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-2 border-ink bg-transparent text-[15px] font-bold text-ink transition-colors hover:bg-ink/5"
                  >
                    <Link to="/drop/26">Peržiūrėti produktą № 26</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-paper pt-6 pb-4">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div ref={heroRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div
              className="reveal relative overflow-hidden rounded-2xl border-2 border-[#1e4048] bg-[#001B21] md:rounded-3xl lg:col-span-12"
              style={{ background: "#001B21" }}
            >
              <div className="grid min-h-[280px] gap-6 p-6 md:p-9 lg:min-h-[360px] lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-stretch">
                <div className="relative z-10 flex flex-col justify-between">
                  <div>
                    <h1 className="heading-display text-d-lg mt-4 tracking-[-0.015em] text-paper">
                      {step === "plan" ? "Pasirink planą." : "Užbaik užsakymą."}
                    </h1>
                    <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.65] text-[#8aabb2]">
                      {step === "plan"
                        ? "Penki lygiai. Atšauk bet kurį mėnesį. Išsiunčiama per 5 dienas po registracijos."
                        : `Tik vienas žingsnis iki pirmosios BRICKTIME ${plan.name} dėžutės.`}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    {(["Pasirinkti planą", "Mokėjimas"] as const).map((s, i) => (
                      <div key={s} className="flex items-center gap-3">
                        <div
                          className={[
                            "flex items-center gap-2 rounded-full border-2 px-4 py-1.5 font-mono text-[11px] tracking-[.08em] uppercase transition-all",
                            (step === "plan" ? i === 0 : i === 1)
                              ? "border-brand-yellow bg-brand-yellow text-ink"
                              : "border-[#2d5560] text-[#5a7e87]",
                          ].join(" ")}
                        >
                          <span>{i + 1}</span>
                          <span>{s}</span>
                        </div>
                        {i === 0 && (
                          <ArrowRightIcon className="size-4 text-[#2d5560]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative min-h-[220px] overflow-hidden rounded-[28px] border-2 border-[#2d5560] bg-[#03262e] shadow-[6px_6px_0_#001B21]">
                  <video
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/subscribe-hero.mp4" type="video/mp4" />
                  </video>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,27,33,0.05)_0%,rgba(0,27,33,0.28)_100%)]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(0,27,33,0)_0%,rgba(0,27,33,0.55)_100%)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {step === "plan" ? (
        /* ── Plan selection ─────────────────────────────────────────── */
        <section className="bg-paper pt-4 pb-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="mb-6 flex justify-center">
              <div className="inline-flex flex-col items-center gap-2">
                <span className="label-mono text-ink/45">Atsiskaitymas</span>
                <div className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper p-1 shadow-[4px_4px_0_#001B21]">
                  {(["monthly", "annual"] as const).map((value) => {
                    const active = billing === value

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBilling(value)}
                        className="rounded-full px-4 py-2 font-mono text-[11px] tracking-[.08em] uppercase transition-all"
                        style={
                          active
                            ? {
                                background: plan.ctaBg,
                                color: plan.ctaText,
                              }
                            : {
                                color: "#001B2199",
                              }
                        }
                      >
                        {value === "monthly" ? "Mėn." : "Metinis −17%"}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* mobile: horizontal scroll carousel; desktop: overlapping flex row */}
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-0 lg:-space-x-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {plans.map((p, i) => (
                <div
                  key={p.name}
                  onClick={() => setSelectedPlan(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedPlan(i)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedPlan === i}
                  className={[
                    "relative flex w-[56vw] shrink-0 snap-center flex-col justify-between rounded-2xl border-2 p-6 text-left transition-all duration-200 hover:z-10 hover:-translate-y-3 md:rounded-3xl md:p-7 lg:w-auto lg:flex-1",
                    selectedPlan === i
                      ? "z-10 -translate-y-3 border-ink shadow-[6px_6px_0_#001B21]"
                      : "border-ink/40 hover:border-ink hover:shadow-[4px_4px_0_#001B21]",
                  ].join(" ")}
                  style={{ background: p.bg, zIndex: i + 1 }}
                >
                  {p.featured && (
                    <Badge
                      className="absolute -top-3.5 right-5 rotate-1 rounded border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] tracking-[.08em] uppercase"
                      style={{ background: "#001B21", color: "#F5F1EB" }}
                    >
                      Populiarus
                    </Badge>
                  )}
                  {selectedPlan === i && (
                    <span className="absolute top-4 right-4 grid size-6 place-items-center rounded-full border-2 border-ink bg-ink text-[11px] font-bold text-paper">
                      ✓
                    </span>
                  )}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="font-display text-3xl leading-[.88]"
                        style={{ color: p.textColor }}
                      >
                        {p.name}
                      </div>
                      {p.brickImage && (
                        <img
                          src={p.brickImage}
                          alt=""
                          className="pointer-events-none h-12 w-auto shrink-0 object-contain select-none md:h-14"
                        />
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span
                        className="text-d-sm font-display leading-[.9]"
                        style={{ color: p.textColor }}
                      >
                        $
                        {billing === "monthly" ? p.monthlyPrice : p.annualPrice}
                      </span>
                      <span
                        className="font-mono text-[11px] tracking-[.06em] uppercase"
                        style={{ color: `${p.textColor}70` }}
                      >
                        /mėn.
                      </span>
                    </div>
                  </div>
                  <ul className="mt-5 flex flex-col gap-2">
                    {p.simplifiedPerks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-2 text-[13px]"
                      >
                        <span
                          className="mt-[3px] size-2.5 shrink-0 rounded-full border-[1.5px]"
                          style={{
                            background: p.accentColor,
                            borderColor: p.textColor,
                          }}
                        />
                        <span style={{ color: `${p.textColor}cc` }}>
                          {perk}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="brick-hover-sm rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper"
                onClick={() => setStep("payment")}
              >
                Tęsti su {plan.name} <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </section>
      ) : (
        /* ── Payment form ───────────────────────────────────────────── */
        <section className="bg-paper pt-4 pb-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div
                className="brick-card p-10 lg:col-span-7"
                style={{ background: "#F5F1EB" }}
              >
                <h3 className="mb-7 text-2xl font-semibold text-ink/50">
                  Mokėjimo duomenys
                </h3>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="label-mono mb-2 block text-ink/60">
                      El. pašto adresas
                    </label>
                    <input
                      type="email"
                      placeholder="jusu@pastas.lt"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="label-mono mb-2 block text-ink/60">
                      Vardas ant kortelės
                    </label>
                    <input
                      type="text"
                      placeholder="Jonas Jonaitis"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="label-mono mb-2 block text-ink/60">
                      Kortelės numeris
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={form.card}
                      maxLength={19}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                        const formatted = digits
                          .replace(/(.{4})/g, "$1 ")
                          .trimEnd()
                        setForm({ ...form, card: formatted })
                      }}
                      className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] tracking-widest text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-mono mb-2 block text-ink/60">
                        Galiojimo laikas
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM / YY"
                        value={form.expiry}
                        maxLength={7}
                        onChange={(e) => {
                          const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4)
                          const formatted =
                            digits.length > 2
                              ? `${digits.slice(0, 2)} / ${digits.slice(2)}`
                              : digits
                          setForm({ ...form, expiry: formatted })
                        }}
                        className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="label-mono mb-2 block text-ink/60">
                        CVC
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="···"
                        value={form.cvc}
                        maxLength={4}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                        className="w-full rounded-2xl border-2 border-ink bg-paper px-5 py-3.5 text-[15px] text-ink transition-shadow placeholder:text-ink/30 focus:shadow-[4px_4px_0_#001B21] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    size="lg"
                    className="brick-hover-sm flex-1 rounded-full border-2 border-ink bg-ink text-[16px] font-bold text-paper"
                    onClick={() => setSubmitted(true)}
                  >
                    Pradėti {plan.name} — $
                    {billing === "annual"
                      ? `${total} šiandien`
                      : `${price}/mėn.`}{" "}
                    →
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[.08em] text-ink/40 uppercase">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheckIcon size={13} />
                    SSL šifravimas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarXIcon size={13} />
                    Atšauk bet kada
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RefreshCcwIcon size={13} />
                    30 dienų grąžinimo garantija
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-5">
                <div
                  className="brick-card p-6 md:p-8"
                  style={{ background: plan.bg }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-semibold text-ink/50">
                      Užsakymo suvestinė
                    </h3>
                    {plan.brickImage && (
                      <img
                        src={plan.brickImage}
                        alt=""
                        className="pointer-events-none h-14 w-auto shrink-0 object-contain select-none"
                      />
                    )}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border-b border-dashed border-ink/30 pb-5">
                    <div
                      className="flex justify-between text-[15px]"
                      style={{ color: plan.textColor }}
                    >
                      <span>
                        {plan.name} planas (
                        {billing === "monthly" ? "mėnesinis" : "metinis"})
                      </span>
                      <span className="font-display text-xl">
                        ${price}/mėn.
                      </span>
                    </div>
                    {billing === "annual" && (
                      <div
                        className="flex justify-between text-[13px]"
                        style={{ color: `${plan.textColor}70` }}
                      >
                        <span>Mokama metiškai (10 mėnesių)</span>
                        <span>
                          −${(plan.monthlyPrice - plan.annualPrice) * 12}{" "}
                          taupoma
                        </span>
                      </div>
                    )}
                    <div
                      className="flex justify-between text-[13px]"
                      style={{ color: `${plan.textColor}70` }}
                    >
                      <span>Produktas № 26 (šis mėnuo)</span>
                      <span>Įskaičiuota</span>
                    </div>
                    <div
                      className="flex justify-between text-[13px]"
                      style={{ color: `${plan.textColor}70` }}
                    >
                      <span>Pristatymas</span>
                      <span>Nemokamas</span>
                    </div>
                  </div>
                  <div
                    className="mt-4 flex items-baseline justify-between"
                    style={{ color: plan.textColor }}
                  >
                    <span className="text-[15px] font-bold">
                      Mokėti šiandien
                    </span>
                    <span className="font-display text-[40px] leading-none">
                      ${billing === "annual" ? total : price}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("plan")}
                  className="text-center font-mono text-[12px] tracking-[.14em] text-ink/50 uppercase transition-colors hover:text-ink"
                >
                  ← Keisti planą
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Comparison table ─────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div
            ref={compareRef}
            className="grid grid-cols-1 gap-4 lg:grid-cols-12"
          >
            <div className="reveal lg:col-span-12">
              <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
                Viskas, greta.
              </h2>
            </div>
            <div
              className="reveal brick-card overflow-x-auto lg:col-span-12"
              style={{ background: "#F5F1EB" }}
            >
              <div className="min-w-[800px]">
                <div
                  className="grid border-b-2 border-ink"
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 1.4fr 1fr 1fr" }}
                >
                  <div className="p-3 font-mono text-[11px] tracking-[.18em] text-ink/40 uppercase md:p-5">
                    Savybė
                  </div>
                  {plans.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between border-l-2 border-ink p-4"
                      style={{ background: p.bg }}
                    >
                      <span
                        className="font-display text-[18px] leading-none uppercase"
                        style={{ color: p.textColor }}
                      >
                        {p.name}
                      </span>
                      {p.featured && (
                        <span
                          className="font-mono text-[9px] tracking-[.1em] uppercase"
                          style={{ color: `${p.textColor}60` }}
                        >
                          Populiarus
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {comparisonRows.map((row) => (
                  <div
                    key={row.feature}
                    className="grid border-b-2 border-dashed border-ink/20 transition-colors last:border-b-0 hover:bg-ink/[.03]"
                    style={{ gridTemplateColumns: "2fr 1fr 1fr 1.4fr 1fr 1fr" }}
                  >
                    <div className="p-4 text-[13px] font-semibold whitespace-nowrap text-ink/70">
                      {row.feature}
                    </div>
                    {[row.nano, row.mini, row.standard, row.pro, row.mega].map(
                      (val, j) => (
                        <div
                          key={j}
                          className="flex items-center border-l-2 border-dashed border-ink/20 p-4 text-[13px] text-ink"
                        >
                          {val === "—" ? (
                            <span className="text-ink/25">—</span>
                          ) : val === "✓" ? (
                            <span className="grid size-5 place-items-center rounded-full border-2 border-ink bg-brand-mint text-[11px] font-bold text-ink">
                              ✓
                            </span>
                          ) : (
                            val
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust signals ────────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div
            ref={trustRef}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {trustTiles.map((t, i) => (
              <div
                key={t.num}
                className="reveal brick-card-hover flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-ink p-6 shadow-[6px_6px_0_#001B21] md:rounded-3xl md:p-8"
                style={{ background: t.bg, transitionDelay: `${i * 70}ms` }}
              >
                <span className="font-display text-[52px] leading-[.85] text-ink/20 select-none">
                  {t.num}
                </span>
                <div>
                  <h3 className="heading-display text-d-xs leading-[.92] text-ink">
                    {t.label}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink/65">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-7">
          <div ref={faqRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div
              className="reveal brick-card relative flex min-h-[280px] flex-col justify-between p-6 md:p-9 lg:col-span-4"
              style={{ background: "#5C4ADE" }}
            >
              <img
                src="/br.svg"
                alt=""
                className="pointer-events-none absolute right-6 bottom-6 w-[200px] select-none"
              />
              <div className="max-w-[50%]">
                <h2 className="heading-display text-d-md tracking-[-0.015em] text-paper">
                  Tai, ko
                  <br />
                  žmonės
                  <br />
                  klausia.
                </h2>
                <p className="mt-5 text-[14px] leading-[1.65] text-paper/65">
                  Vis dar neaišku? Rašyk mums{" "}
                  <a
                    href="mailto:hi@bricktime.co"
                    className="text-brand-yellow underline underline-offset-2"
                  >
                    hi@bricktime.co
                  </a>
                </p>
              </div>
            </div>
            <div
              className="reveal brick-card p-6 md:p-9 lg:col-span-8"
              style={{ background: "#F5F1EB" }}
            >
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
