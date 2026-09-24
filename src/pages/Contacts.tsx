import { Link } from "react-router-dom"
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { socials } from "@/data/socials"

const contactRows = [
  {
    icon: MailIcon,
    label: "El. paštas",
    value: "info@bricktime.lt",
    href: "mailto:info@bricktime.lt",
  },
  {
    icon: PhoneIcon,
    label: "Telefonas",
    value: "+370 682 11695",
    href: "tel:+37068211695",
  },
  {
    icon: MapPinIcon,
    label: "Adresas",
    value: "Pasakų g. 10-1, Vilnius",
    href: "https://maps.google.com/?q=Pasakų g. 10-1, Vilnius",
  },
]

const faqLinks = [
  { label: "D.U.K.", to: "/duk" },
  { label: "Pristatymas", to: "/pristatymas" },
  { label: "Grąžinimai", to: "/grazinimai" },
  { label: "Praleisti / pristabdyti", to: "/praleisti-pristabdyti" },
]

export default function Contacts() {
  return (
    <>
      <Seo
        title="Kontaktai"
        description="Susisiek su Brick Time komanda el. paštu, telefonu ar socialiniuose tinkluose – atsakysime kuo greičiau."
        path="/kontaktai"
      />
      <Nav />
      <main className="bg-paper text-ink">
        <section className="pb-8">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <p className="label-mono text-ink/40">Susisiek su mumis</p>
                <h1 className="heading-display text-d-xl mt-4 max-w-[14ch] tracking-[-0.015em] text-ink">
                  Turi klausimų?
                  <br />
                  Parašyk mums.
                </h1>
                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                  Ar tai klausimas apie prenumeratą, rinkinį, ar tiesiog norisi
                  pasisveikinti – Brick Time komanda atsako darbo dienomis per
                  24 valandas.
                </p>

                <ul className="mt-8 flex flex-col gap-4">
                  {contactRows.map((row) => (
                    <li key={row.label}>
                      <a
                        href={row.href}
                        target={row.label === "Adresas" ? "_blank" : undefined}
                        rel={
                          row.label === "Adresas"
                            ? "noreferrer noopener"
                            : undefined
                        }
                        className="brick-hover-sm flex items-center gap-4 rounded-2xl border-2 border-ink bg-paper p-4"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-brand-yellow">
                          <row.icon className="size-5 text-ink" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-mono text-[12px] tracking-[0.08em] text-ink/45 uppercase">
                            {row.label}
                          </span>
                          <span className="text-[16px] font-bold text-ink">
                            {row.value}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-full border-2 border-ink px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              <aside className="brick-card self-start bg-ink p-6 text-paper md:p-8">
                <p className="label-mono text-paper/50">Dažniausi klausimai</p>
                <p className="mt-4 text-[15px] leading-7 text-paper/78">
                  Prieš rašydami – pažiūrėkite, gal atsakymą jau turime
                  paruoštą.
                </p>
                <ul className="mt-6 space-y-3">
                  {faqLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center justify-between border-b border-paper/12 pb-3 text-[15px] font-bold text-paper transition-opacity hover:opacity-70"
                      >
                        {link.label}
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-paper/12 pt-6">
                  <p className="font-mono text-[12px] tracking-[0.08em] text-paper/45 uppercase">
                    Pardavėjas
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-paper/78">
                    MB „Brick time“, į.k. 307611342
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
