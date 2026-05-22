import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type HelpPageProps = {
  eyebrow: string
  title: string
  intro: string
  accent: string
  summary: { label: string; value: string }[]
  sections: { title: string; body: string }[]
  checklist: string[]
  note: string
}

function HelpPage({
  title,
  intro,
  accent,
  sections,
  checklist,
  note,
}: HelpPageProps) {
  return (
    <>
      <Nav />
      <main className="bg-paper text-ink">
        <section className="bg-paper">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <h1 className="heading-display text-d-xl max-w-[14ch] tracking-[-0.015em] text-ink">
              {title}
            </h1>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">{intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/subscribe"
                className="brick-hover-sm inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-3 text-[14px] font-bold text-paper"
              >
                Pasirinkti planą
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
        </section>

        <section className="py-10 md:py-20">
          <div className="mx-auto grid max-w-[1320px] gap-6 px-4 md:px-7 lg:grid-cols-[1.2fr_.8fr]">
            <div className="grid gap-4">
              {sections.map((section, index) => (
                <article key={section.title} className="brick-card bg-paper p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label-mono text-ink/40">0{index + 1}</p>
                      <h2 className="heading-display text-d-xs mt-3 text-ink">{section.title}</h2>
                    </div>
                    <div
                      className="mt-1 hidden h-3 w-20 rounded-full border border-ink/15 md:block"
                      style={{ background: accent }}
                    />
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
                    <li key={item} className="flex gap-3 text-[15px] leading-6 text-paper/78">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full border border-paper/30 bg-brand-yellow" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="brick-card p-6 md:p-8" style={{ background: accent }}>
                <p className="label-mono text-ink/55">Pastaba</p>
                <p className="mt-4 text-[15px] leading-7 text-ink/78 md:text-[16px]">{note}</p>
                <a
                  href="mailto:hello@bricktime.lt"
                  className="brick-hover-sm mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3 text-[14px] font-bold text-ink"
                >
                  Susisiekti dėl pagalbos
                  <ArrowRightIcon className="size-4" />
                </a>
              </div>
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
      intro="Trumpi atsakymai į dažniausius klausimus apie BRICKTIME prenumeratą, biudžetą, produktų keitimą ir kaip viskas veikia nuo pirmo mėnesio."
      accent="rgba(255, 215, 49, 0.72)"
      summary={[
        { label: 'Atsakymai', value: 'Svarbiausia informacija viename puslapyje.' },
        { label: 'Planai', value: 'Kiekvienas planas turi savo mėnesinį € biudžetą.' },
        { label: 'Keitimas', value: 'Grąžinus aktyvius produktus gali rinktis kitus.' },
      ]}
      sections={[
        {
          title: 'Kaip veikia mėnesinis biudžetas?',
          body:
            'Kiekvienas planas atrakina nustatytą mėnesinį biudžetą, kurį gali paskirstyti keliems produktams vienu metu. Svarbi ne vienetų suma, o jų bendra vertė kataloge.',
        },
        {
          title: 'Ar galiu turėti daugiau nei vieną produktą?',
          body:
            'Taip. Gali laikyti tiek produktų, kiek telpa į tavo plano limitą. Kai nori išsirinkti naujus, pirmiausia inicijuoji grąžinimą ir po patvirtinimo limitas vėl atsilaisvina.',
        },
        {
          title: 'Ar visi produktai prieinami visiems planams?',
          body:
            'Ne. Dalis dropų ir aukštesnės vertės rinkinių yra tier-gated. Kuo aukštesnis planas, tuo platesnis archyvas ir ankstesnė prieiga prie išskirtinių leidimų.',
        },
      ]}
      checklist={[
        'Prenumerata veikia mėnesio ciklais, be ilgalaikio įsipareigojimo.',
        'Grąžinimo patvirtinimas atlaisvina tavo biudžetą kitam pasirinkimui.',
        'Katalogas nuolat kinta, todėl verta sekti naujus dropus ir archyvą.',
      ]}
      note="Jei ieškai specifinės informacijos apie siuntas, pauzę ar grąžinimo eigą, apačioje footer’yje rasi atskirus dedikuotus puslapius su išplėstomis taisyklėmis."
    />
  )
}

export function PausePage() {
  return (
    <HelpPage
      eyebrow="Pagalba / Praleisti / pristabdyti"
      title="Praleisti / pristabdyti"
      intro="Kartais statybos ritmas sulėtėja. Šiame puslapyje aiškiai aprašyta, kada gali praleisti mėnesį, kaip veikia pristabdymas ir kas nutinka tavo planui tuo metu."
      accent="rgba(255, 174, 231, 0.72)"
      summary={[
        { label: 'Lankstumas', value: 'Per metus gali praleisti iki 3 mėnesių.' },
        { label: 'Mokėjimai', value: 'Pristabdžius naujas sąskaitas sustabdome iki atnaujinimo.' },
        { label: 'Paskyra', value: 'Valdymas vyksta tavo account skiltyje.' },
      ]}
      sections={[
        {
          title: 'Kada verta praleisti mėnesį?',
          body:
            'Jei keliauji, nori užbaigti jau turimą rinkinį ar tiesiog mėnesiui atsitraukti nuo naujų siuntų, gali praleisti ateinantį ciklą prieš kitą sąskaitos išrašymo datą.',
        },
        {
          title: 'Ką reiškia pristabdymas?',
          body:
            'Pristabdžius planą naujos siuntos ir nauji mokesčiai nestartuos, kol plano neatnaujinsi. Tavo paskyra išlieka aktyvi, tačiau naujų produktų rezervuoti negalėsi.',
        },
        {
          title: 'Kaip atnaujinti prenumeratą?',
          body:
            'Kai būsi pasiruošęs grįžti, atnaujini planą iš paskyros ir kitas atsiskaitymo ciklas vėl suteikia tavo mėnesinį biudžetą. Planą gali tęsti tuo pačiu arba kitu tier.',
        },
      ]}
      checklist={[
        'Praleidimas taikomas ateinančiam ciklui, ne jau pradėtam mėnesiui.',
        'Aktyvūs produktai turi būti grąžinimo procese, jei nori pilno pauzės režimo.',
        'Atnaujinus planą, tavo prieigos ir katalogo matomumas grįžta pagal pasirinktą tier.',
      ]}
      note="Jei nori pristabdyti planą tą pačią dieną, geriausia tai padaryti dar prieš naujo mėnesio apmokėjimą. Tokiu atveju išvengsi papildomo ciklo aktyvavimo."
    />
  )
}

export function ShippingPage() {
  return (
    <HelpPage
      eyebrow="Pagalba / Pristatymas"
      title="Pristatymas"
      intro="BRICKTIME siuntas siunčia taip, kad pakeitimas tarp rinkinių būtų kuo sklandesnis. Čia rasi pagrindines pristatymo taisykles, terminus ir ką tikėtis po užsakymo."
      accent="rgba(77, 162, 255, 0.72)"
      summary={[
        { label: 'Geografija', value: 'Pristatome į 42 šalis.' },
        { label: 'Standartas', value: 'Standartinis pristatymas įtrauktas visuose planuose.' },
        { label: 'Greitis', value: 'Skubus pristatymas taikomas aukštesniuose tier.' },
      ]}
      sections={[
        {
          title: 'Kada siunta iškeliauja?',
          body:
            'Patvirtinus užsakymą ir rezervavus produktus, siunta ruošiama išsiuntimui. Dauguma užsakymų iškeliauja per 1–2 darbo dienas, o sekimo informacija pateikiama paskyroje.',
        },
        {
          title: 'Kiek trunka pristatymas?',
          body:
            'Standartinis pristatymas Europoje įprastai trunka 3–5 darbo dienas. Tolimesnėse rinkose terminas gali būti ilgesnis, o aukštesni planai gauna spartesnį maršrutą, kai tai prieinama.',
        },
        {
          title: 'Kas įskaičiuota į planą?',
          body:
            'Visi planai apima standartinį siuntos pristatymą. Standard, Pro ir Mega nariai gali gauti prioritetinį apdorojimą bei greitesnį pristatymo lygį, priklausomai nuo regiono.',
        },
      ]}
      checklist={[
        'Sekimo numerį matysi paskyroje vos tik siunta bus užregistruota.',
        'Adreso pakeitimus verta atlikti prieš naujo užsakymo patvirtinimą.',
        'Jei siunta vėluoja, pagalbos komanda gali patikrinti konkretų sekimo statusą.',
      ]}
      note="Pristatymo greitis priklauso nuo tavo regiono ir pasirinkto plano. Jei užsakymas ypač laukiamos naujienos dalis, rekomenduojame aukštesnį tier su prioritetiniu siuntos paruošimu."
    />
  )
}

export function ReturnsPage() {
  return (
    <HelpPage
      eyebrow="Pagalba / Grąžinimai"
      title="Grąžinimai"
      intro="Kai norisi naujo rinkinio, grąžinimo procesas turi būti paprastas. Šis puslapis aprašo, kaip inicijuoti grąžinimą, ką supakuoti ir kada vėl atsirakina tavo planų biudžetas."
      accent="rgba(93, 219, 156, 0.72)"
      summary={[
        { label: 'Etiketė', value: 'Grąžinimo etiketę inicijuoji savo paskyroje.' },
        { label: 'Pakuotė', value: 'Siunčiama su apsauga, kad produktas grįžtų saugiai.' },
        { label: 'Biudžetas', value: 'Patvirtinus grąžinimą, limitas atsinaujina naujam pasirinkimui.' },
      ]}
      sections={[
        {
          title: 'Kaip pradėti grąžinimą?',
          body:
            'Paskyros lange pasirenki aktyvų produktą ir inicijuoji grąžinimą. Sistema sugeneruoja tolesnius veiksmus, o tu gauni aiškią siuntos grąžinimo eigą.',
        },
        {
          title: 'Ką reikia įdėti į siuntą?',
          body:
            'Supakuok produktą saugiai ir grąžink su visomis priklausančiomis dalimis bei aksesuarais. Taip užtikrinama, kad kitas narys gautų pilną patirtį, o tavo pakeitimas neužstrigtų.',
        },
        {
          title: 'Kada galiu rinktis kitą produktą?',
          body:
            'Kai grąžinimas pasiekia mūsų komandą ir yra patvirtinamas, tavo plano vertės limitas atnaujinamas. Tada gali iškart grįžti į archyvą ar laukti kito dropo.',
        },
      ]}
      checklist={[
        'Grąžinimą verta inicijuoti iš anksto, jei nori greitai pereiti prie kito rinkinio.',
        'Saugus supakavimas padeda išvengti papildomos patikros.',
        'Patvirtintas grąžinimas atlaisvina vietą tavo kitam pasirinkimui.',
      ]}
      note="Jei nori keisti produktą kuo greičiau, grąžinimą inicijuok dar prieš išsirenkant kitą rinkinį. Taip tavo limitas bus atnaujintas vos tik siunta bus patvirtinta."
    />
  )
}
