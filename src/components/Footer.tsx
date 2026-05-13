import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  Prenumerata: [
    { label: 'Planai', href: '#plans' },
    { label: 'Šis mėnuo', href: '#' },
    { label: 'Archyvas', href: '#' },
    { label: 'Dovanų kortelės', href: '#' },
  ],
  Pagalba: [
    { label: 'D.U.K.', href: '/duk' },
    { label: 'Praleisti / pristabdyti', href: '/praleisti-pristabdyti' },
    { label: 'Pristatymas', href: '/pristatymas' },
    { label: 'Grąžinimai', href: '/grazinimai' },
  ],
  Įmonė: [
    { label: 'Apie mus', href: '#' },
    { label: 'Spauda', href: '#' },
    { label: 'Keitimų klubas', href: '#' },
    { label: 'Karjera', href: '#' },
  ],
}

const socials = ['Instagram', 'TikTok', 'Discord']

export default function Footer() {
  return (
    <footer className="bg-white pt-8 pb-16 text-ink mt-0">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        {/* Grid */}
        <div className="grid grid-cols-2 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img src="/bricktime.svg" alt="BRICKTIME" className="h-12 w-auto" />
            <p className="mt-4 max-w-[32ch] text-[14px] leading-relaxed text-ink/60">
              Mėnesinė kaladėlių prenumerata suaugusiems, kurie niekada negalutinai nustojo statyti. Pagaminta Vilniuje, pristatoma visame pasaulyje.
            </p>
            <div className="mt-6 flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-full border-2 border-ink px-3.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 label-mono text-ink/40">
                {section}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[15px] text-ink/70 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mt-16 mb-6 bg-ink/[.18]" />

        <div className="flex flex-wrap justify-between gap-4 font-mono text-[13px] text-ink/50">
          <span>© 2026 BRICKTIME UAB</span>
          <span>BRICKTIME™ — originalus prekės ženklas · nesusijęs su jokiu žaislų gamintoju</span>
        </div>
      </div>
    </footer>
  )
}
