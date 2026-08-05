import { lazy, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import Nav from "@/components/Nav"
import Hero from "@/components/Hero"
import Marquee from "@/components/Marquee"
import { NextDrop } from "@/components/NextDrop"
import { Seo } from "@/components/Seo"

const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts"))
const HowItWorks = lazy(() => import("@/components/HowItWorks"))
const Subscriptions = lazy(() => import("@/components/Subscriptions"))
const Testimonials = lazy(() => import("@/components/Testimonials"))
const FAQ = lazy(() => import("@/components/FAQ"))
const Footer = lazy(() => import("@/components/Footer"))
const FloatingVideoWidget = lazy(
  () => import("@/components/FloatingVideoWidget")
)

export default function Home() {
  const navigate = useNavigate()
  return (
    <>
      <Seo
        title="Brick Time – LEGO® rinkinių prenumerata"
        description="Prenumeruok LEGO® rinkinius pagal savo biudžetą, laikyk kiek nori ir keisk į naujus, kai atsibosta. Pristatymas visoje Lietuvoje."
        path="/"
      />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <NextDrop />
        <Suspense fallback={null}>
          <FeaturedProducts />
          <HowItWorks />
          <Subscriptions
            onSubscribe={(plan, billing) =>
              navigate(`/checkout?plan=${plan.id}&billing=${billing}`)
            }
          />
          <Testimonials />
          <FAQ />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
        <FloatingVideoWidget />
      </Suspense>
    </>
  )
}
