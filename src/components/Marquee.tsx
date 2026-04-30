const items = ['STATYK', 'RINK', 'KARTOK', 'NAUJAS PRODUKTAS KAS MĖNESĮ', 'NEMOKAMAS PRISTATYMAS', 'PRALEISK BET KADA']

const avatars = [
  '/avatars/avatar-classic.png',
  '/avatars/avatar-beanie.png',
  '/avatars/avatar-ninja.png',
  '/avatars/avatar-robot.png',
  '/avatars/avatar-wizard.png',
]

export default function Marquee() {
  const repeated = [...items, ...items]

  return (
    <div className="overflow-hidden border-b-2 border-t-2 border-ink bg-paper text-ink">
      <div
        className="marquee-track flex gap-12 whitespace-nowrap py-[18px]"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 42px)', letterSpacing: '-.005em' }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            {item}
            <img
              src={avatars[i % avatars.length]}
              alt=""
              className="size-10 rounded-full object-cover border-2 border-brand-yellow"
            />
          </span>
        ))}
      </div>
    </div>
  )
}
