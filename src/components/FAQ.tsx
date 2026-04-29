import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useReveal } from '@/hooks/useReveal'

const faqs = [
  {
    q: 'What are the bricks made of?',
    a: 'Premium ABS plastic at industry-standard 1.6mm tolerance. Fully compatible with any compatible-brand bricks you already own — they snap, hold, and pop apart cleanly.',
  },
  {
    q: 'Can I skip a month?',
    a: "Yes. From your dashboard, hit Skip before the 1st of the month. We'll bill you again next cycle, no questions asked.",
  },
  {
    q: 'Do drops connect to each other?',
    a: 'Every drop is part of the BRICKTIME universe — a 12-month arc of connected builds that form a complete street, vehicle fleet, or world. Subscribe at any month, build forward.',
  },
  {
    q: 'Where do you ship?',
    a: 'Worldwide. Free standard shipping in the EU, UK and US. Expedited tier ships in 2 business days.',
  },
  {
    q: 'What if I receive a duplicate minifig?',
    a: 'Open the BRICKTIME Trade Club from your dashboard. Duplicates are common currency — trade with another subscriber for free.',
  },
]

const stats = [
  { value: '12,400+', label: 'Active subscribers' },
  { value: '★ 4.9', label: 'Average rating' },
  { value: '26', label: 'Drops shipped' },
  { value: '0', label: 'Questions with no answer' },
]

export default function FAQ() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section id="faq" className="bg-paper py-20">
      <div className="mx-auto max-w-[1320px] px-7">
        {/*
          Bento 12-col, 2 rows:
          [Accordion col-7 row-2] [Stats tile col-5]
          [                    ] [CTA tile col-5]
        */}
        <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* FAQ accordion — col-span-7, row-span-2 */}
          <div
            className="reveal rounded-3xl border-2 border-ink bg-paper p-9 shadow-[6px_6px_0_#001B21] lg:col-span-7 lg:row-span-2"
          >
            <p className="font-mono text-[11px] tracking-[.22em] uppercase text-ink/50">⬢ FAQ</p>
            <h2
              className="mt-3 uppercase text-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 4vw, 68px)',
                lineHeight: '.88',
                letterSpacing: '-.01em',
              }}
            >
              Quick
              <br />
              questions.
            </h2>

            <Accordion type="single" collapsible defaultValue="item-0" className="mt-8">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b-2 border-ink py-0.5">
                  <AccordionTrigger
                    className="py-5 text-left hover:no-underline"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(18px, 2vw, 24px)',
                      lineHeight: 1,
                      letterSpacing: '-.01em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="max-w-[58ch] pb-5 text-[15px] leading-[1.65] text-ink/70">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Stats tile — col-span-5 */}
          <div
            className="reveal grid grid-cols-2 gap-4 rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_rgba(245,241,235,.1)] lg:col-span-5"
            style={{ background: '#001B21' }}
          >
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col justify-between rounded-2xl border border-paper/15 p-5" style={{ minHeight: 100 }}>
                <div
                  className="text-paper"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: .9 }}
                >
                  {s.value}
                </div>
                <div className="mt-2 font-mono text-[10px] tracking-[.16em] uppercase text-paper/50">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA tile — col-span-5, row 2 */}
          <div
            className="reveal flex flex-col justify-between rounded-3xl border-2 border-ink p-8 shadow-[6px_6px_0_#001B21] lg:col-span-5"
            style={{ background: '#5C4ADE' }}
          >
            <div>
              <p className="font-mono text-[10px] tracking-[.22em] uppercase text-paper/60">Still on the fence?</p>
              <h3
                className="mt-3 uppercase text-paper"
                style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: '.9' }}
              >
                First drop,
                <br />
                zero risk.
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-paper/70">
                Cancel before your first billing date and pay nothing. We'll still send you a tracking link.
              </p>
            </div>
            <a
              href="#plans"
              className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-paper/40 bg-brand-yellow px-6 py-3 text-center font-bold text-[15px] text-ink transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_rgba(0,0,0,.2)]"
            >
              Choose a plan →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
