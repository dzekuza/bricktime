import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import { NextDrop } from '@/components/NextDrop'

const FeaturedProducts = lazy(() => import('@/components/FeaturedProducts'))
const HowItWorks = lazy(() => import('@/components/HowItWorks'))
const WhatsInside = lazy(() => import('@/components/WhatsInside'))
const Plans = lazy(() => import('@/components/Plans'))
const Testimonials = lazy(() => import('@/components/Testimonials'))
const FAQ = lazy(() => import('@/components/FAQ'))
const Footer = lazy(() => import('@/components/Footer'))
const FloatingVideoWidget = lazy(() => import('@/components/FloatingVideoWidget'))

export default function Home() {
  const navigate = useNavigate()
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <NextDrop />
        <Suspense fallback={null}>
          <FeaturedProducts />
          <HowItWorks />
          <Plans onSubscribe={(plan, billing) => navigate(`/checkout?plan=${plan.id}&billing=${billing}`)} />
          <WhatsInside />
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
