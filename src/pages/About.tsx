import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useReveal'

const VALUES = [
  {
    num: '01',
    bg: '#FFD731',
    title: 'Statyk daugiau',
    body: 'LEGO® rinkiniai skirti statyti, ne dulkėti lentynose. Prenumerata leidžia nuolat keisti projektus be brangių vienkartinių pirkimų.',
  },
  {
    num: '02',
    bg: '#5CDB9C',
    title: 'Sutaupyk protingai',
    body: 'Vienas mėnesinis mokestis suteikia prieigą prie šimtų rinkinių. Moki tik už naudojimą, ne už nuosavybę.',
  },
  {
    num: '03',
    bg: '#FFAEE7',
    title: 'Bendraukis',
    body: 'BRICKTIME bendruomenė – tai žmonės, kurie stato, fotografuoja ir dalijasi savo darbais. Prisijunk prie augančio rato.',
  },
  {
    num: '04',
    bg: '#4DA2FF',
    title: 'Keisk be streso',
    body: 'Grąžini rinkinį kai tik baigi. Kitą gali pasirinkti tą pačią dieną. Jokių biurokratijos kliūčių.',
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
                  Mes{' '}
                  <span className="inline-block -rotate-[1.5deg] border-[3px] border-ink bg-brand-yellow px-2 shadow-[5px_5px_0_rgba(0,27,33,0.12)]">
                    mylime
                  </span>
                  <br />
                  LEGO® taip pat.
                </h1>
                <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.65] text-ink/65">
                  BRICKTIME gimė iš paprastos idėjos: rinkiniai skirti statyti, o ne kaupti. Mes sukūrėme prenumeratos paslaugą, kuri leidžia mėgautis LEGO® be ribų ir be bereikalingų išlaidų.
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
                  className="w-full rounded-2xl border-2 border-ink object-cover aspect-[2/1] shadow-[6px_6px_0_#001B21]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-paper py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink">
                  Kodėl<br />
                  <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]" style={{ transformOrigin: 'center center' }}>BRICKTIME?</span>
                </h2>
                <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.75] text-ink/70">
                  Pradėjome kaip entuziastai, kurie suprato, kad LEGO® rinkiniai per brangūs vienai statymo patirčiai. Lentynos pildosi, biudžetas senka — o troškimas statyti neišnyksta.
                </p>
                <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.75] text-ink/70">
                  BRICKTIME atsakymas paprastas: nuomok, statyk, grąžink. Kitas rinkinys jau laukia kataloge. Moki mažiau, statai daugiau.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="brick-card bg-ink p-6 md:p-8">
                  <p className="heading-display text-d-md text-brand-yellow">€0</p>
                  <p className="mt-3 text-[14px] leading-[1.6] text-paper/70">Pristatymo mokesčio visuose planuose</p>
                </div>
                <div className="brick-card p-6 md:p-8" style={{ background: '#FFD731' }}>
                  <p className="heading-display text-d-md text-ink">30d</p>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink/70">Pilna pinigų grąžinimo garantija be klausimų</p>
                </div>
                <div className="brick-card p-6 md:p-8 col-span-2" style={{ background: '#5CDB9C' }}>
                  <p className="heading-display text-d-sm text-ink">Atšauk bet kada.</p>
                  <p className="mt-3 text-[14px] leading-[1.6] text-ink/70">Jokių ilgalaikių įsipareigojimų. Vienas paspaudimas paskyros skydelyje.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-paper py-10 md:py-20">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <h2 className="heading-display text-d-lg tracking-[-0.015em] text-ink mb-8">
              Mūsų<br />
              <span className="inline-block rotate-[-1.5deg] border-[3px] border-ink bg-brand-yellow px-[.12em] text-ink shadow-[5px_5px_0_rgba(0,27,33,.12)]" style={{ transformOrigin: 'center center' }}>principai.</span>
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
                  <span className="font-display text-[52px] leading-[.85] text-ink/20 select-none">{v.num}</span>
                  <div>
                    <h3 className="heading-display text-d-xs leading-[.92] text-ink">{v.title}</h3>
                    <p className="mt-3 text-[14px] leading-[1.6] text-ink/65">{v.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-paper pb-16 pt-4 md:pb-28">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="brick-card flex flex-col items-center gap-6 bg-ink p-10 text-center md:p-16">
              <h2 className="heading-display text-d-lg tracking-[-0.015em] text-paper">
                Prisijunk<br />
                <span className="inline-block italic text-brand-yellow skew-x-[-8deg]">šiandien.</span>
              </h2>
              <p className="max-w-[44ch] text-[17px] leading-[1.65] text-paper/65">
                Pasirink planą, peržiūrėk katalogą ir pirmasis rinkinys keliaus tiesiai pas tave.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/subscribe"
                  className="brick-hover-sm inline-flex items-center gap-2 rounded-full border-2 border-paper bg-paper px-6 py-3 text-[15px] font-bold text-ink"
                >
                  Žiūrėti planus
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
