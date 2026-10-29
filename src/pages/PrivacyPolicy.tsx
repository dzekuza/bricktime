import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { useLegalPage } from "@/hooks/useLegalPage"

const baseContactRows = [
  ["Valdytojas", "MB „Brick time“"],
  ["Juridinio asmens kodas", "307611342"],
  ["Adresas", "Pasakų g. 10-1, Vilnius"],
  ["Telefonas", "+370 682 11695"],
  ["El. paštas", "info@bricktime.lt"],
]

export default function PrivacyPolicy() {
  const page = useLegalPage("privacy_policy")
  const contactRows = [
    ...baseContactRows,
    ["Redakcija", page?.revisionDate ?? "—"],
  ]

  return (
    <>
      <Seo
        title="Privatumo politika"
        description="Brick Time privatumo politika – kaip tvarkome tavo asmens duomenis naudojantis mūsų LEGO® rinkinių prenumeratos paslauga."
        path="/privatumo-politika"
      />
      <Nav />
      <main className="bg-paper text-ink">
        <section className="pb-8">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <h1 className="heading-display text-d-xl max-w-[12ch] tracking-[-0.015em] text-ink">
                  Privatumo
                  <br />
                  politika
                </h1>
                <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-ink/70">
                  {page?.intro}
                </p>
              </div>

              <aside className="brick-card self-start bg-ink p-6 text-paper md:p-8">
                <div className="space-y-4">
                  {contactRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 border-b border-paper/12 pb-4 last:border-b-0 last:pb-0"
                    >
                      <span className="font-mono text-[12px] tracking-[0.08em] text-paper/45 uppercase">
                        {label}
                      </span>
                      {label === "El. paštas" ? (
                        <a
                          href={`mailto:${value}`}
                          className="text-[15px] leading-6 text-paper"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="text-[15px] leading-6 text-paper">
                          {value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="mx-auto grid max-w-[1320px] gap-5 px-4 md:px-7">
            {page === null && (
              <article className="brick-card bg-paper p-6 md:p-8">
                <p className="text-[15px] leading-7 text-ink/74 md:text-[16px]">
                  Nepavyko įkelti turinio. Pabandykite vėliau arba susisiekite
                  el. paštu info@bricktime.lt.
                </p>
              </article>
            )}
            {page?.sections.map((section, index) => (
              <article
                key={section.id}
                className="brick-card bg-paper p-6 md:p-8"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="label-mono text-ink/40">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="heading-display text-d-xs mt-3 text-ink">
                      {section.title}
                    </h2>
                  </div>
                  <a
                    href={`#${section.id}`}
                    className="font-mono text-[12px] tracking-[0.08em] text-ink/35 uppercase"
                  >
                    #{section.id}
                  </a>
                </div>

                <div id={section.id} className="mt-5 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[15px] leading-7 text-ink/74 md:text-[16px]"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && (
                    <ul className="grid gap-3 pt-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-3 text-[15px] leading-7 text-ink/74 md:text-[16px]"
                        >
                          <span className="mt-[11px] h-2.5 w-2.5 shrink-0 rounded-full border border-ink/25 bg-brand-yellow" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}

            <article className="brick-card bg-[#FFD731] p-6 md:p-8">
              <p className="label-mono text-ink/45">Kontaktai</p>
              <h2 className="heading-display text-d-xs mt-3 text-ink">
                Jei turite klausimų
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-ink/78 md:text-[16px]">
                Jei turėtumėte klausimų dėl šios privatumo politikos ar savo
                asmens duomenų tvarkymo, susisiekite el. paštu{" "}
                <a
                  href="mailto:info@bricktime.lt"
                  className="font-bold text-ink underline underline-offset-4"
                >
                  info@bricktime.lt
                </a>{" "}
                arba telefonu{" "}
                <a
                  href="tel:+37068211695"
                  className="font-bold text-ink underline underline-offset-4"
                >
                  +370 682 11695
                </a>
                .
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
