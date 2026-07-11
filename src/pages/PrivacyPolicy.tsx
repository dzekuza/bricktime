import Nav from "@/components/Nav"
import Footer from "@/components/Footer"

type Section = {
  id: string
  title: string
  body: string[]
  bullets?: string[]
}

const sections: Section[] = [
  {
    id: "bendra",
    title: "Bendroji informacija",
    body: [
      "Ši privatumo politika nustato MB „Brick time“, juridinio asmens kodas 307611342, buveinės adresas Pasakų g. 10-1, Vilnius, elektroninio pašto adresas info@bricktime.lt, vykdomo interneto svetainės www.bricktime.lt lankytojų ir kitų duomenų subjektų asmens duomenų tvarkymo sąlygas bei su tuo susijusių teisių įgyvendinimo tvarką.",
      "Valdytojas gali bet kuriuo metu peržiūrėti ir pakeisti privatumo politiką, todėl rekomenduojama periodiškai patikrinti aktualią jos redakciją. Interneto svetainės lankytojų asmens duomenys tvarkomi vadovaujantis galiojančiais teisės aktais ir taikant tinkamas technines bei organizacines apsaugos priemones.",
      "Jūsų duomenys naudojami tik šioje privatumo politikoje nurodytais tikslais. Jie gali būti perduodami Valdytojo duomenų tvarkytojams, teikiantiems interneto svetainės talpinimo ir priežiūros paslaugas, o įstatymų numatytais atvejais ir kompetentingoms valdžios institucijoms.",
      "Svetainėje gali būti nuorodų į trečiųjų šalių interneto svetaines. Už šių svetainių privatumo praktikas Valdytojas neatsako, todėl rekomenduojama susipažinti ir su jų privatumo politikomis.",
    ],
  },
  {
    id: "slapukai",
    title: "Slapukų naudojimas",
    body: [
      "Interneto svetainėje naudojami slapukai padeda užtikrinti tinkamą svetainės veikimą, optimalų greitį bei saugumą, analizuoti lankytojų srautus ir tobulinti naudotojo patirtį.",
      "Naršymo metu gali būti naudojami būtini ir analitiniai slapukai, taip pat trečiųjų šalių, pavyzdžiui, Facebook ir Instagram, įskiepiai. Informaciją apie konkrečius slapukus galite matyti savo naršyklės nustatymuose.",
      "Slapukus galite apriboti arba užblokuoti savo naršyklėje, tačiau tokiu atveju dalis svetainės funkcijų gali veikti netinkamai arba būti neprieinamos.",
    ],
    bullets: [
      "Būtinasis slapukas `bricktime_cookie_consent` naudojamas jūsų pasirinkimui dėl slapukų sutikimo įsiminti (galioja 12 mėnesių).",
      "Analitiniai ir rinkodaros slapukai (`_ga`, `ga*`, `_fbp`, `_fbc`) įkeliami tik gavus jūsų sutikimą svetainėje rodomame slapukų pranešime; savo pasirinkimą galite bet kada pakeisti.",
      "Analitiniai duomenys gali apimti IP adresą, įrenginio informaciją, apytikslę geografinę vietą, aplankytus puslapius, sesijos trukmę, paspaudimus ir atėjimo šaltinį.",
      "Daugiau informacijos apie slapukus ir jų valdymą galite rasti adresu `http://www.allaboutcookies.org`.",
    ],
  },
  {
    id: "komunikacija",
    title: "Komunikacijos tikslu tvarkomi duomenys",
    body: [
      "Tikslu atsakyti į jūsų užklausą ir išsaugoti komunikacijos įrodymus, Valdytojas tvarko informaciją, kurią pateikiate susisiekdami el. paštu, paštu, per paklausimo formą arba per socialinius tinklus.",
      "Kartu su paklausimais pateikti asmens duomenys bei tolimesnis susirašinėjimas saugomi tiek, kiek reikia konkrečiai užduočiai įvykdyti ir Valdytojo teisėms užtikrinti, bet ne ilgiau kaip 1 metus nuo duomenų gavimo dienos.",
      "Susisiekiant per socialinių tinklų paskyras, jūsų duomenys gali būti atskleisti tų socialinių tinklų valdytojams pagal jų taikomas privatumo taisykles.",
    ],
    bullets: [
      "El. paštu: el. pašto adresas, laiško data, laikas ir susirašinėjimo turinys.",
      "Paštu: siuntėjo vardas, pavardė, adresas, gavimo data ir laiške nurodyta informacija.",
      "Paklausimo forma: vardas, pavardė, el. pašto adresas, telefono numeris, užklausos data, laikas ir turinys.",
      "Facebook ar Instagram: vartotojo vardas, pavardė ir susirašinėjimo turinys.",
    ],
  },
  {
    id: "paskyra",
    title: "Registracija ir asmeninės paskyros administravimas",
    body: [
      "Sukuriant ir administruojant asmeninę paskyrą, duomenys tvarkomi siekiant suteikti galimybę patogiau naudotis Valdytojo paslaugomis ir elektronine parduotuve.",
      "Teisinis šio tvarkymo pagrindas yra jūsų sutikimas susikurti paskyrą. Registracijos ir prisijungimo duomenys saugomi 10 metų nuo paskutinio aktyvaus veiksmo interneto svetainėje arba iki paskyros ištrynimo.",
      "Duomenys, susiję su užsakymais ir prenumeratomis elektroninėje parduotuvėje, saugomi 10 metų nuo užsakymo ar prenumeratos galiojimo pabaigos.",
    ],
    bullets: [
      "Registracijos metu: vardas, el. pašto adresas, slaptažodis, registracijos data ir laikas.",
      "Prisijungimo metu: el. pašto adresas, slaptažodis, prisijungimų data ir laikas.",
      "Paskyroje: užsakymų ir prenumeratų istorija.",
    ],
  },
  {
    id: "prekyba",
    title: "Elektroninė prekyba ir sutarčių vykdymas",
    body: [
      "Tikslu sudaryti ir įvykdyti sutartį bei įvykdyti užsakymą elektroninėje parduotuvėje, Valdytojas tvarko su pirkimu, atsiskaitymu ir pristatymu susijusius pirkėjų asmens duomenis.",
      "Teisinis tvarkymo pagrindas yra siekis įvykdyti pirkimo-pardavimo sutartį. Jei sutartis sudaroma su juridiniu asmeniu, gali būti tvarkomi ir atstovo duomenys.",
      "Šie duomenys saugomi 10 metų nuo užsakymo ar prenumeratos galiojimo pabaigos.",
    ],
    bullets: [
      "Vardas, pavardė, el. pašto adresas, kontaktinis telefono numeris ir pristatymo adresas.",
      "Mokėjimo data, pasirinktos prenumeratos, kainos, kiekiai, mokėjimo būdas, kita atsiskaitymo informacija, suteiktos nuolaidos ir banko sąskaitos numeris.",
      "Informacija apie pasirinktą pristatymo būdą ir vietą.",
    ],
  },
  {
    id: "atsiliepimai",
    title: "Atsiliepimų pateikimas ir administravimas",
    body: [
      "Prisijungęs naudotojas gali palikti atsiliepimą apie Valdytojo teikiamas paslaugas. Svetainėje gali būti rodomas atsiliepimą pateikusio asmens vardas, pavardės pirma raidė ir atsiliepimo turinys.",
      "Teisinis tvarkymo pagrindas yra jūsų sutikimas pateikti atsiliepimą. Atsiliepimai gali būti matomi tol, kol prekiaujama atitinkama paslauga, bet ne ilgiau kaip 10 metų nuo atsiliepimo pateikimo dienos.",
      "Atsiliepimą galite bet kada panaikinti prisijungę prie savo paskyros arba kreipdamiesi į Valdytoją.",
    ],
    bullets: [
      "Vardas ir pavardė.",
      "Atsiliepimo data ir laikas.",
      "Atsiliepimo turinys.",
    ],
  },
  {
    id: "rinkodara",
    title: "Tiesioginė rinkodara",
    body: [
      "Naujienlaiškį galite užsisakyti svetainėje nurodydami savo el. pašto adresą. Tiesioginės rinkodaros tikslu naudojamas tik prenumeratoriaus el. pašto adresas.",
      "Teisinis tvarkymo pagrindas yra jūsų sutikimas gauti naujienlaiškius. Duomenys šiuo tikslu gali būti perduodami marketingo paslaugų teikėjams.",
      "Asmens duomenys tiesioginės rinkodaros tikslu tvarkomi 10 metų nuo prenumeratos pradžios, o informacija apie sutikimą saugoma dar vienerius metus po naujienlaiškių siuntimo pabaigos.",
    ],
    bullets: [
      "Bet kada galite atsisakyti naujienlaiškio paspausdami atsisakymo nuorodą laiške.",
      "Taip pat galite pateikti atsisakymą el. paštu info@bricktime.lt.",
    ],
  },
  {
    id: "teises",
    title: "Teisių įgyvendinimo tvarka",
    body: [
      "Visi asmenys, kurių asmens duomenis tvarko Valdytojas, turi teisę susipažinti su tvarkomais duomenimis, reikalauti juos ištaisyti, apriboti tvarkymą, gauti duomenų perkeliamumą, nesutikti su tvarkymu, reikalauti ištrinti duomenis ir pateikti skundą priežiūros institucijai.",
      "Prašymai dėl šių teisių įgyvendinimo teikiami raštu Valdytojo buveinės adresu arba el. paštu info@bricktime.lt. Kai kuriais atvejais gali būti reikalingas kvalifikuotas elektroninis parašas arba notaro patvirtinta asmens dokumento kopija.",
      "Pagrįsti prašymai vykdomi teisės aktuose ir politikoje nustatytais terminais: pavyzdžiui, duomenų perkeliamumas ir ištrynimas ne vėliau kaip per 30 dienų, o duomenų tvarkymo apribojimas per 5 darbo dienas nuo prašymo gavimo.",
    ],
    bullets: [
      "Teisė susipažinti su tvarkomais asmens duomenimis.",
      "Teisė reikalauti ištaisyti neteisingus ar netikslius duomenis.",
      "Teisė reikalauti apriboti duomenų tvarkymą.",
      "Teisė į duomenų perkeliamumą.",
      "Teisė nesutikti su duomenų tvarkymu.",
      "Teisė reikalauti ištrinti duomenis.",
      "Teisė paduoti skundą Valstybinei duomenų apsaugos inspekcijai.",
    ],
  },
]

const contactRows = [
  ["Valdytojas", "MB „Brick time“"],
  ["Juridinio asmens kodas", "307611342"],
  ["Adresas", "Pasakų g. 10-1, Vilnius"],
  ["Telefonas", "+370 682 11695"],
  ["El. paštas", "info@bricktime.lt"],
  ["Redakcija", "2026-07-12"],
]

export default function PrivacyPolicy() {
  return (
    <>
      <Nav />
      <main className="bg-paper text-ink">
        <section className="pb-8">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <p className="label-mono text-ink/40">
                  Teisinė informacija / Privatumas
                </p>
                <h1 className="heading-display text-d-xl mt-4 max-w-[12ch] tracking-[-0.015em] text-ink">
                  Privatumo
                  <br />
                  politika
                </h1>
                <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-ink/70">
                  Šiame puslapyje pateikiama informacija apie tai, kokius asmens
                  duomenis tvarko BRICKTIME, kokiais tikslais jie naudojami,
                  kiek laiko saugomi ir kaip galite įgyvendinti savo teises.
                </p>
              </div>

              <aside className="brick-card self-start bg-ink p-6 text-paper md:p-8">
                <p className="label-mono text-paper/50">Trumpai</p>
                <div className="mt-5 space-y-4">
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
            {sections.map((section, index) => (
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
                      className="max-w-[78ch] text-[15px] leading-7 text-ink/74 md:text-[16px]"
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
              <p className="mt-4 max-w-[64ch] text-[15px] leading-7 text-ink/78 md:text-[16px]">
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
