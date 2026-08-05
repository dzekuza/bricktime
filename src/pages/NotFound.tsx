import { Link } from "react-router-dom"
import { ArrowRightIcon } from "lucide-react"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"

export default function NotFound() {
  return (
    <>
      <Seo
        title="Puslapis nerastas"
        description="Šis puslapis neegzistuoja arba buvo perkeltas."
        path="/404"
        noindex
      />
      <Nav />
      <main className="bg-paper text-ink">
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-[1320px] px-4 text-center md:px-7">
            <p className="label-mono text-ink/40">Klaida 404</p>
            <h1 className="heading-display text-d-xl mt-4 text-ink">
              Puslapis nerastas
            </h1>
            <p className="mt-6 text-[17px] leading-[1.65] text-ink/65">
              Šio puslapio neradome – galbūt jis buvo perkeltas arba
              neegzistuoja.
            </p>
            <Link
              to="/"
              className="brick-hover-sm mt-8 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-3 text-[14px] font-bold text-paper"
            >
              Grįžti į pradžią
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
