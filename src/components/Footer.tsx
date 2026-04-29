import { Separator } from '@/components/ui/separator'

const footerLinks = {
  Subscribe: [
    { label: 'Plans', href: '#plans' },
    { label: 'This month', href: '#' },
    { label: 'Archive', href: '#' },
    { label: 'Gift cards', href: '#' },
  ],
  Help: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Skip / pause', href: '#' },
    { label: 'Shipping', href: '#' },
    { label: 'Returns', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Trade club', href: '#' },
    { label: 'Careers', href: '#' },
  ],
}

const socials = ['Instagram', 'TikTok', 'Discord']

export default function Footer() {
  return (
    <footer className="bg-ink pb-8 pt-20 text-paper" style={{ marginTop: 0 }}>
      <div className="mx-auto max-w-[1320px] px-7">
        {/* Grid */}
        <div className="grid grid-cols-2 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div
              className="flex items-center gap-2.5 text-paper"
              style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}
            >
              <span
                className="grid size-9 place-items-center rounded-full border-2 border-paper bg-brand-yellow text-ink"
                style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}
              >
                B!
              </span>
              BRICKTIME
            </div>
            <p className="mt-4 max-w-[32ch] text-[14px] leading-relaxed text-paper/75">
              A monthly brick subscription for adults who never quite stopped building. Made in Vilnius, shipped worldwide.
            </p>
            <div className="mt-6 flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-full border-2 border-paper px-3.5 py-1.5 text-[13px] font-semibold text-paper transition-colors hover:bg-paper hover:text-ink"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 font-mono text-[11px] tracking-[.18em] uppercase text-paper/60">
                {section}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[15px] text-paper/80 transition-colors hover:text-brand-yellow"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mt-16 mb-6 bg-paper/[.18]" />

        <div className="flex flex-wrap justify-between gap-4 font-mono text-[13px] text-paper/70">
          <span>© 2026 BRICKTIME UAB</span>
          <span>BRICKTIME™ — original brand · not affiliated with any toy manufacturer</span>
        </div>
      </div>
    </footer>
  )
}
