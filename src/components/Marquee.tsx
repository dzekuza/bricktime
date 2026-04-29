const items = ['BUILD', 'COLLECT', 'REPEAT', 'NEW DROP EVERY MONTH', 'FREE SHIPPING', 'SKIP ANY TIME']

export default function Marquee() {
  const repeated = [...items, ...items]

  return (
    <div className="overflow-hidden border-b-2 border-t-2 border-ink bg-ink text-paper">
      <div
        className="marquee-track flex gap-12 whitespace-nowrap py-[18px]"
        style={{ fontFamily: 'var(--font-display)', fontSize: 42, letterSpacing: '-.005em' }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            {item}
            <span className="text-brand-yellow">★</span>
          </span>
        ))}
      </div>
    </div>
  )
}
