import { Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  Atrask: [
    { label: "Prenumeratos", href: "/subscribe" },
    { label: "Rinkiniai", href: "/archive" },
    { label: "Bendruomenė", href: "/community" },
    { label: "Dovanų kuponas", href: "/gift-cards" },
  ],
  Pagalba: [
    { label: "D.U.K.", href: "/duk" },
    { label: "Kontaktai", href: "mailto:info@bricktime.lt" },
    { label: "Pristatymas", href: "/pristatymas" },
    { label: "Grąžinimai", href: "/grazinimai" },
  ],
  Įmonė: [
    { label: "Apie mus", href: "/apie" },
    { label: "Merch", href: "/merch" },
    { label: "Privatumo politika", href: "/privatumo-politika" },
    { label: "Parduotuvės taisyklės", href: "/parduotuves-taisykles" },
  ],
}

const socials = ["Facebook", "Instagram", "TikTok"]

export default function Footer() {
  return (
    <footer className="bg-paper pt-8 pb-16 text-ink">
      <div className="mx-auto max-w-[1320px] px-4 md:px-7">
        {/* Grid */}
        <div className="grid grid-cols-2 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img src="/bricktime.svg" alt="BRICKTIME" className="h-12 w-auto" />
            <p className="mt-4 max-w-none text-[14px] leading-relaxed text-ink/60 md:max-w-[32ch]">
              Pirmoji originalių LEGO® rinkinių prenumerata Lietuvoje. Konstruok
              daugiau, atrask naujus projektus ir mėgaukis LEGO® be didelių
              išlaidų.
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
              <h4 className="label-mono mb-4 text-ink/40">{section}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) =>
                  link.href.startsWith("mailto:") ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[15px] text-ink/70 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-[15px] text-ink/70 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mt-16 mb-6 bg-ink/[.18]" />

        <div className="flex flex-wrap justify-between gap-4 font-mono text-[13px] text-ink/50">
          <span>© 2026 Brick Time MB.</span>
          <span>
            BRICKTIME™ — originalus prekės ženklas · nesusijęs su jokiu žaislų
            gamintoju
          </span>
        </div>
        <p className="mt-3 max-w-[68ch] text-[11px] leading-relaxed text-ink/35">
          LEGO® yra registruotas prekės ženklas, priklausantis „LEGO Group“
          įmonių grupei, kuri nėra susijusi, neremia ir kitaip neprisideda prie
          šios veiklos vystymo.
        </p>
      </div>
    </footer>
  )
}
