const items = [
  "STATYK",
  "RINK",
  "KARTOK",
  "NAUJAS PRODUKTAS KAS SAVAITĘ",
  "NEMOKAMAS PRISTATYMAS",
  "PRALEISK BET KADA",
]

const avatars = [
  "/avatars/avatar-classic.png",
  "/avatars/avatar-beanie.png",
  "/avatars/avatar-ninja.png",
  "/avatars/avatar-robot.png",
  "/avatars/avatar-wizard.png",
]

export default function Marquee() {
  const repeated = [...items, ...items]

  return (
    <div className="overflow-hidden border-t-2 border-b-2 border-ink bg-paper text-ink">
      <div className="marquee-track text-d-sm flex gap-12 py-[18px] font-display tracking-[-0.005em] whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            {item}
            <img
              src={avatars[i % avatars.length]}
              alt=""
              className="size-10 rounded-full border-2 border-ink object-cover"
            />
          </span>
        ))}
      </div>
    </div>
  )
}
