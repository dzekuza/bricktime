import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import { NextDrop } from '@/components/NextDrop'
import HowItWorks from '@/components/HowItWorks'
import WhatsInside from '@/components/WhatsInside'
import Plans from '@/components/Plans'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import FloatingVideoWidget from '@/components/FloatingVideoWidget'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <NextDrop />
        <HowItWorks />
        <WhatsInside />
        <Plans />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      <FloatingVideoWidget />
    </>
  )
}
