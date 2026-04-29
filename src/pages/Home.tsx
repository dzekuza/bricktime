import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import HowItWorks from '@/components/HowItWorks'
import WhatsInside from '@/components/WhatsInside'
import Plans from '@/components/Plans'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import BigCTA from '@/components/BigCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <WhatsInside />
        <Plans />
        <Testimonials />
        <FAQ />
        <BigCTA />
      </main>
      <Footer />
    </>
  )
}
