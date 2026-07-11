const FREEDOM_FEATURES = [
  {
    num: "01",
    title: "Nemokamas pristatymas",
    body: "Visus LEGO® rinkinius pristatome nemokamai visoje Lietuvoje.",
  },
  {
    num: "02",
    title: "Konstruok savo tempu",
    body: "Rinkinius gali laikyti tiek, kiek reikia – kol tavo prenumerata aktyvi.",
  },
  {
    num: "03",
    title: "Jokių ilgalaikių įsipareigojimų",
    body: "Keisk prenumeratą, pristabdyk ją arba nutrauk tada, kai tau patogu.",
  },
  {
    num: "04",
    title: "Nauji rinkiniai kiekvieną savaitę",
    body: "Katalogą nuolat papildome naujais LEGO® rinkiniais. Sek naujienas ir pirmasis atrask naujausius papildymus.",
  },
]

export function HowItWorksFreedom() {
  return (
    <div className="reveal lg:col-span-12">
      <div className="brick-card bg-ink p-7 md:p-10">
        <h3 className="heading-display text-d-md text-paper">
          Laisvė
          <br />
          <span className="inline-block rotate-[-1.5deg] border-[3px] border-paper/30 bg-brand-yellow px-[.12em] text-ink">
            konstruoti.
          </span>
        </h3>
        <p className="mt-5 max-w-[56ch] text-[15px] leading-[1.65] text-paper/70">
          Jokių ilgalaikių įsipareigojimų, nemokamas pristatymas ir prenumerata,
          prisitaikanti prie tavo konstravimo tempo. Kiekvieną savaitę atrask
          naujus LEGO® konstravimo projektus.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FREEDOM_FEATURES.map((f) => (
            <div
              key={f.num}
              className="rounded-2xl border-2 border-paper/15 p-5"
            >
              <span className="label-mono text-brand-yellow">{f.num}</span>
              <h4 className="heading-display text-d-xs mt-2 text-paper">
                {f.title}
              </h4>
              <p className="mt-2 text-[13px] leading-[1.6] text-paper/60">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
