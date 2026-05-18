import { lazy, Suspense } from 'react'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import { NextDrop } from '@/components/NextDrop'

const HowItWorks = lazy(() => import('@/components/HowItWorks'))
const WhatsInside = lazy(() => import('@/components/WhatsInside'))
const Plans = lazy(() => import('@/components/Plans'))
const Testimonials = lazy(() => import('@/components/Testimonials'))
const FAQ = lazy(() => import('@/components/FAQ'))
const Footer = lazy(() => import('@/components/Footer'))
const FloatingVideoWidget = lazy(() => import('@/components/FloatingVideoWidget'))

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <NextDrop />
        <Suspense fallback={null}>
          <HowItWorks />
          <WhatsInside />
          <Plans />
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
