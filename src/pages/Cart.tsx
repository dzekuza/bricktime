import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"
import { MerchCartSection } from "@/components/cart/MerchCartSection"
import { RentalCartSection } from "@/components/cart/RentalCartSection"

/** One cart for both: LEGO sets (claimed against the budget) and merch (paid). */
export default function Cart() {
  return (
    <>
      <Seo title="Krepšelis" path="/krepselis" noindex />
      <Nav />
      <section className="bg-paper py-4 md:py-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-4 md:gap-14 md:px-7">
          <h1 className="heading-display text-d-lg text-ink">Krepšelis</h1>
          <RentalCartSection />
          <MerchCartSection />
        </div>
      </section>
      <Footer />
    </>
  )
}
