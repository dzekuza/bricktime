import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { useReveal } from "@/hooks/useReveal"

const VALUES = [
  {
    num: "01",
    bg: "#FFD731",
    title: "Konstruok be ribų",
    body: "Pamiršk vieną rinkinį per metus. Su Brick Time gali nuolat atrasti naujus LEGO® rinkinius ir mėgautis konstravimu tiek, kiek norisi.",
  },
  {
    num: "02",
    bg: "#5CDB9C",
    title: "Rinkis iš plačios LEGO® rinkinių kolekcijos.",
    body: "Nuo mažų projektų iki didžiausių kolekcinių modelių – visada rasi kitą iššūkį, atitinkantį tavo pomėgius ir prenumeratą.",
  },
  {
    num: "03",
    bg: "#FFAEE7",
    title: "Būk bendruomenės dalimi",
    body: "Dalinkis savo kūriniais, dalyvauk iššūkiuose, rink bendruomenės taškus ir susipažink su žmonėmis, kuriuos vienija ta pati aistra LEGO®.",
  },
  {
    num: "04",
    bg: "#4DA2FF",
    title: "Keisk savo tempu",
    body: "Baigei konstruoti? Grąžink rinkinį ir išsirink kitą. Jokių ilgalaikių įsipareigojimų – tik laisvė konstruoti tada, kada nori.",
  },
]

export default function About() {
  const valuesRef = useReveal<HTMLDivElement>()

  return (
    <>
      <Nav />
      <main className="bg-paper text-ink">
        {/* Hero */}
        <section className="bg-paper">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div>
                <h1 className="heading-display text-d-xl max-w-[14ch] tracking-[-0.015em] text-ink">
                  Mes{" "}
                  <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                    mylime
                  </span>{" "}
                  LEGO®
                  <br />
                  taip, kaip ir tu.
                </h1>
                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                  Tikime, kad geriausia LEGO® rinkinio dalis – konstravimo
                  procesas. Todėl sukūrėme Brick Time – pirmąją Lietuvoje LEGO®
                  prenumeratos paslaugą, leidžiančią konstruoti vis naujus
                  rinkinius be didelių išlaidų ir vietos stokos.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/subscribe"
                    className="brick-hover-sm inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-3 text-[14px] font-bold text-paper"
                  >
                    Pradėti prenumeratą
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    to="/community"
                    className="brick-hover-sm inline-flex items-center rounded-full border-2 border-ink/20 px-5 py-3 text-[14px] font-bold text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  >
                    Bendruomenė
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <img
                  src="/images/build-spaceship.jpg"
                  alt="LEGO statyba"
                  className="aspect-[2/1] w-full rounded-2xl border-2 border-ink object-cover shadow-[6px_6px_0_#001B21]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-paper py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
              <div>
                <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
                  Kodėl
                  <br />
                  <span
                    className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                    style={{ transformOrigin: "center center" }}
                  >
                    BRICKTIME?
                  </span>
                </h2>
                <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.75] text-ink/70">
                  Brick Time gimė iš paprastos minties – didžiausias LEGO®
                  džiaugsmas yra ne turėti rinkinį lentynoje, o jį konstruoti.
                </p>
                <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.75] text-ink/70">
                  Būdami LEGO® entuziastais supratome, kad norisi vis naujų
                  iššūkių, tačiau įspūdingi rinkiniai užima daug vietos ir
                  kainuoja nemažai. Todėl sukūrėme Brick Time – kad galėtum
                  konstruoti daugiau, o kaupti mažiau.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="brick-card bg-ink p-6 md:p-8">
                  <p className="heading-display text-d-md text-brand-yellow">
                    €0
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.6] text-paper/70">
                    Pristatymas visose prenumeratose
                  </p>
                </div>
                <div
                  className="brick-card p-6 md:p-8"
                  style={{ background: "#5CDB9C" }}
                >
                  <p className="heading-display text-d-sm text-ink">
                    Atšauk bet kada.
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink/70">
                    Jokių ilgalaikių įsipareigojimų. Atšauk prenumeratą bet kada
                    savo paskyroje.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-paper py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <h2 className="heading-display text-d-lg mb-8 tracking-[-0.015em] text-ink">
              Kodėl verta rinktis
              <br />
              <span
                className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]"
                style={{ transformOrigin: "center center" }}
              >
                Brick Time?
              </span>
            </h2>
            <div
              ref={valuesRef}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {VALUES.map((v, i) => (
                <div
                  key={v.num}
                  className="reveal brick-card-hover flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-ink p-6 shadow-[6px_6px_0_#001B21] md:rounded-3xl md:p-8"
                  style={{ background: v.bg, transitionDelay: `${i * 70}ms` }}
                >
                  <span className="font-display text-[52px] leading-[.85] text-ink/20 select-none">
                    {v.num}
                  </span>
                  <div>
                    <h3 className="heading-display text-d-xs leading-[.92] text-ink">
                      {v.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.6] text-ink/65">
                      {v.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-paper pt-4 pb-16 md:pb-28">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="brick-card flex flex-col items-center gap-6 bg-ink p-10 text-center md:p-16">
              <h2 className="heading-display text-d-lg tracking-[-0.015em] text-paper">
                Prisijunk
                <br />
                <span className="inline-block skew-x-[-8deg] text-brand-yellow italic">
                  šiandien.
                </span>
              </h2>
              <p className="max-w-[44ch] text-[17px] leading-[1.65] text-paper/65">
                Pasirink prenumeratą, išsirink pirmąjį LEGO® rinkinį ir netrukus
                jis keliaus pas tave.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/subscribe"
                  className="brick-hover-sm inline-flex items-center gap-2 rounded-full border-2 border-paper bg-paper px-6 py-3 text-[15px] font-bold text-ink"
                >
                  Peržiūrėti prenumeratas
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/archive"
                  className="brick-hover-sm inline-flex items-center rounded-full border-2 border-white/30 px-6 py-3 text-[15px] font-bold text-paper/80 transition-colors hover:border-paper hover:text-paper"
                >
                  Naršyti katalogą
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
