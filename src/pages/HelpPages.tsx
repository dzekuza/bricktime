import { Link } from "react-router-dom"
import { ArrowRightIcon } from "lucide-react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"

type HelpPageProps = {
  eyebrow: string
  title: string
  intro: string
  accent: string
  heroImage?: string
  summary: { label: string; value: string }[]
  sections: { title: string; body: string }[]
  checklist: string[]
  note: string
  helpNote?: { title: string; body: string }
}

function HelpPage({
  title,
  intro,
  accent,
  heroImage,
  sections,
  checklist,
  note,
  helpNote,
}: HelpPageProps) {
  return (
    <>
      <Nav />
      <main className="bg-paper text-ink">
        <section className="bg-paper">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div>
                <h1 className="heading-display text-d-xl max-w-[14ch] tracking-[-0.015em] text-ink">
                  {title}
                </h1>
                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                  {intro}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/subscribe"
                    className="brick-hover-sm inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-3 text-[14px] font-bold text-paper"
                  >
                    Pasirinkti prenumeratą
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link
                    to="/archive"
                    className="brick-hover-sm inline-flex items-center rounded-full border-2 border-ink/20 px-5 py-3 text-[14px] font-bold text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  >
                    Peržiūrėti katalogą
                  </Link>
                </div>
              </div>
              {heroImage && (
                <div className="hidden lg:block">
                  <img
                    src={heroImage}
                    alt={title}
                    className="aspect-[2/1] w-full rounded-2xl border-2 border-ink object-cover shadow-[6px_6px_0_#001B21]"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-20">
          <div className="mx-auto grid max-w-[1320px] gap-6 px-4 md:px-7 lg:grid-cols-[1.2fr_.8fr]">
            <div className="grid gap-4">
              {sections.map((section, index) => (
                <article
                  key={section.title}
                  className="brick-card bg-paper p-6 md:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label-mono text-ink/40">0{index + 1}</p>
                      <h2 className="heading-display text-d-xs mt-3 text-ink">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-ink/72 md:text-[16px]">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>

            <aside className="grid gap-4 self-start lg:sticky lg:top-28">
              <div className="brick-card bg-ink p-6 text-paper md:p-8">
                <p className="label-mono text-paper/50">Trumpai</p>
                <ul className="mt-5 space-y-3">
                  {checklist.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-[15px] leading-6 text-paper/78"
                    >
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full border border-paper/30 bg-brand-yellow" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="brick-card p-6 md:p-8"
                style={{ background: accent }}
              >
                <p className="label-mono text-ink/55">Pastaba</p>
                <p className="mt-4 text-[15px] leading-7 text-ink/78 md:text-[16px]">
                  {note}
                </p>
                <a
                  href="mailto:hello@bricktime.lt"
                  className="brick-hover-sm mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3 text-[14px] font-bold text-ink"
                >
                  Susisiekti su mumis
                  <ArrowRightIcon className="size-4" />
                </a>
              </div>

              {helpNote && (
                <div className="brick-card bg-paper p-6 md:p-8">
                  <h2 className="heading-display text-d-xs text-ink">
                    {helpNote.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-7 text-ink/72 md:text-[16px]">
                    {helpNote.body}
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export function FAQPage() {
  return (
    <HelpPage
      eyebrow="Pagalba / D.U.K."
      title="D.U.K."
      intro="Čia rasi atsakymus į dažniausiai užduodamus klausimus apie BrickTime – nuo prenumeratų ir LEGO® rinkinių iki pristatymo, grąžinimo bei paslaugos veikimo."
      accent="rgba(255, 215, 49, 0.72)"
      summary={[
        {
          label: "Atsakymai",
          value: "Svarbiausia informacija viename puslapyje.",
        },
        {
          label: "Prenumeratos",
          value: "Kiekviena prenumerata turi savo mėnesinį € biudžetą.",
        },
        {
          label: "Keitimas",
          value: "Grąžinus aktyvius produktus gali rinktis kitus.",
        },
      ]}
      sections={[
        {
          title: "Kaip veikia mėnesinis biudžetas?",
          body: "Kiekviena prenumerata atrakina nustatytą mėnesinį biudžetą, kurį gali paskirstyti keliems produktams vienu metu. Svarbi ne vienetų suma, o jų bendra vertė kataloge.",
        },
        {
          title: "Ar galiu turėti daugiau nei vieną produktą?",
          body: "Taip. Gali laikyti tiek produktų, kiek telpa į tavo prenumeratos limitą. Kai nori išsirinkti naujus, pirmiausia inicijuoji grąžinimą ir po patvirtinimo limitas vėl atsilaisvina.",
        },
        {
          title: "Ar visi produktai prieinami visiems planams?",
          body: "Ne. Dalis dropų ir aukštesnės vertės rinkinių yra tier-gated. Kuo aukštesnė prenumerata, tuo platesnis archyvas ir ankstesnė prieiga prie išskirtinių leidimų.",
        },
      ]}
      checklist={[
        "Prenumeratos laikotarpis pradedamas skaičiuoti nuo jos aktyvavimo dienos.",
        "LEGO® rinkinį gali laikyti neribotą laiką, kol tavo prenumerata yra aktyvi.",
        "Prieš grąžindamas rinkinį nepamiršk paskyroje pranešti apie trūkstamas detales.",
      ]}
      note="Kiekvienas grąžintas LEGO® rinkinys kruopščiai patikrinamas ir surūšiuojamas pagal oficialią LEGO® instrukciją. Taip užtikriname, kad kiekvienas BrickTime narys gautų pilną, tvarkingą ir naujam konstravimo projektui paruoštą rinkinį."
    />
  )
}

export function PausePage() {
  return (
    <HelpPage
      eyebrow="Pagalba / Praleisti / pristabdyti"
      title="Praleisti / pristabdyti"
      intro="Kartais statybos ritmas sulėtėja. Šiame puslapyje aiškiai aprašyta, kada gali praleisti mėnesį, kaip veikia pristabdymas ir kas nutinka tavo prenumeratai tuo metu."
      accent="rgba(255, 174, 231, 0.72)"
      summary={[
        {
          label: "Lankstumas",
          value: "Per metus gali praleisti iki 3 mėnesių.",
        },
        {
          label: "Mokėjimai",
          value: "Pristabdžius naujas sąskaitas sustabdome iki atnaujinimo.",
        },
        { label: "Paskyra", value: "Valdymas vyksta tavo account skiltyje." },
      ]}
      sections={[
        {
          title: "Kada verta praleisti mėnesį?",
          body: "Jei keliauji, nori užbaigti jau turimą rinkinį ar tiesiog mėnesiui atsitraukti nuo naujų siuntų, gali praleisti ateinantį ciklą prieš kitą sąskaitos išrašymo datą.",
        },
        {
          title: "Ką reiškia pristabdymas?",
          body: "Pristabdžius prenumeratą naujos siuntos ir nauji mokesčiai nestartuos, kol jos neatnaujinsi. Tavo paskyra išlieka aktyvi, tačiau naujų produktų rezervuoti negalėsi.",
        },
        {
          title: "Kaip atnaujinti prenumeratą?",
          body: "Kai būsi pasiruošęs grįžti, atnaujini prenumeratą iš paskyros ir kitas atsiskaitymo ciklas vėl suteikia tavo mėnesinį biudžetą. Prenumeratą gali tęsti tuo pačiu arba kitu tier.",
        },
      ]}
      checklist={[
        "Praleidimas taikomas ateinančiam ciklui, ne jau pradėtam mėnesiui.",
        "Aktyvūs produktai turi būti grąžinimo procese, jei nori pilno pauzės režimo.",
        "Atnaujinus prenumeratą, tavo prieigos ir katalogo matomumas grįžta pagal pasirinktą tier.",
      ]}
      note="Jei nori pristabdyti prenumeratą tą pačią dieną, geriausia tai padaryti dar prieš naujo mėnesio apmokėjimą. Tokiu atveju išvengsi papildomo ciklo aktyvavimo."
    />
  )
}

export function ShippingPage() {
  return (
    <HelpPage
      eyebrow="Pagalba / Pristatymas"
      title="Pristatymas"
      intro="BrickTime rūpinasi, kad LEGO® rinkinių pristatymas būtų kuo sklandesnis. Čia rasi svarbiausią informaciją apie pristatymo būdus, terminus ir tai, ko tikėtis po užsakymo."
      accent="rgba(77, 162, 255, 0.72)"
      heroImage="/images/build-sailboat.jpg"
      summary={[
        { label: "Geografija", value: "Pristatome į 42 šalis." },
        {
          label: "Standartas",
          value: "Standartinis pristatymas įtrauktas visose prenumeratose.",
        },
        {
          label: "Greitis",
          value: "Skubus pristatymas taikomas aukštesniuose tier.",
        },
      ]}
      sections={[
        {
          title: "Kada siunta iškeliauja?",
          body: "Patvirtinus užsakymą, pradedame ruošti tavo LEGO® rinkinį siuntimui. Siunta įprastai iškeliauja per 1–2 darbo dienas.",
        },
        {
          title: "Kiek trunka pristatymas?",
          body: "Pristatymas Lietuvoje įprastai trunka 3–5 darbo dienas nuo siuntos išsiuntimo.",
        },
        {
          title: "Ar pristatymas įskaičiuotas?",
          body: "Taip. LEGO® rinkinių pristatymas įskaičiuotas į visas BrickTime prenumeratas. Pristatymo būdas priklauso nuo pasirinktos prenumeratos.",
        },
        {
          title: "Kaip sekti siuntą?",
          body: "Kai siunta bus išsiųsta, jos būseną ir sekimo informaciją galėsi matyti savo BrickTime paskyroje.",
        },
        {
          title: "Negaunu siuntos – ką daryti?",
          body: "Jei siunta vėluoja arba kyla klausimų dėl pristatymo, susisiek su mumis – padėsime išspręsti situaciją.",
        },
      ]}
      checklist={[
        "Siuntos sekimo informaciją rasi savo BrickTime paskyroje, kai siunta bus išsiųsta.",
        "LEGO® rinkinio pristatymas įskaičiuotas į visas BrickTime prenumeratas.",
        "Pristatymo būdas priklauso nuo pasirinktos prenumeratos.",
      ]}
      note="Pradedame ruošti tavo LEGO® rinkinį vos patvirtinus užsakymą. Siunta įprastai iškeliauja per 1–2 darbo dienas, o pristatymas Lietuvoje dažniausiai trunka 3–5 darbo dienas."
    />
  )
}

export function ReturnsPage() {
  return (
    <HelpPage
      eyebrow="Pagalba / Grąžinimai"
      title="Grąžinimai"
      intro="Baigei konstruoti? Laikas kitam rinkiniui. Grąžinimo procesas paprastas ir greitas. Čia sužinosi, kaip inicijuoti grąžinimą, kaip tinkamai paruošti rinkinį siuntimui ir kada galėsi išsirinkti kitą LEGO® rinkinį."
      accent="rgba(93, 219, 156, 0.72)"
      heroImage="/images/build-cactus.jpg"
      summary={[
        {
          label: "Etiketė",
          value: "Grąžinimo etiketę inicijuoji savo paskyroje.",
        },
        {
          label: "Pakuotė",
          value: "Siunčiama su apsauga, kad produktas grįžtų saugiai.",
        },
        {
          label: "Biudžetas",
          value:
            "Patvirtinus grąžinimą, limitas atsinaujina naujam pasirinkimui.",
        },
      ]}
      sections={[
        {
          title: "Kaip paruošti rinkinį siuntimui?",
          body: "Išrink LEGO® rinkinį, detales sudėk į pridėtą (-us) maišelį (-ius), instrukciją – į apsauginį maišelį ir viską saugiai supakuok į dėžę. Grąžink rinkinį su visomis detalėmis ir priedais, kad kitas narys galėtų mėgautis pilna BrickTime patirtimi.",
        },
        {
          title: "Kaip grąžinti rinkinį?",
          body: "Rinkinį grąžink tokiu pačiu būdu, kokiu jis buvo pristatytas. Jei gavai per paštomatą – grąžink per paštomatą. Jei pristatė kurjeris – grąžinimą atlik per kurjerį.",
        },
        {
          title: "Trūksta detalės?",
          body: "Jei pastebėjai, kad trūksta detalės, prieš inicijuodamas grąžinimą prisijunk prie savo paskyros ir užpildyk trūkstamos detalės formą. Tai padės mums greičiau patikrinti rinkinį ir užtikrins sklandų grąžinimo procesą. Svarbu: apie trūkstamą detalę būtina pranešti prieš grąžinant rinkinį. Jei trūkumas bus nustatytas tik patikros metu, jis bus vertinamas pagal BrickTime taisykles.",
        },
        {
          title: "Kada galėsiu rinktis kitą rinkinį?",
          body: "Gavę tavo siuntą, rinkinį patikrinsime per 3 darbo dienas. Po sėkmingos patikros tavo užsakymas bus užbaigtas. Jei tavo prenumeratos laikotarpiui jau priklauso naujas užsakymas, galėsi išsirinkti kitą LEGO® rinkinį pagal savo prenumeratą.",
        },
      ]}
      checklist={[
        "Inicijuok grąžinimą savo paskyroje.",
        "Jei trūksta detalės – pranešk prieš grąžinimą.",
        "Rinkinį grąžink tuo pačiu būdu, kuriuo jis buvo pristatytas.",
        "Patikrą atliekame per 3 darbo dienas.",
      ]}
      note="Jei nori keisti produktą kuo greičiau, grąžinimą inicijuok dar prieš išsirenkant kitą rinkinį. Taip tavo limitas bus atnaujintas vos tik siunta bus patvirtinta."
      helpNote={{
        title: "Reikia pagalbos?",
        body: "Neradai atsakymo į savo klausimą? Peržiūrėk DUK arba susisiek su mūsų komanda – mielai padėsime.",
      }}
    />
  )
}
