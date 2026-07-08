# Homepage pakeitimai — analizė ir žemėlapis į kodą

Šis dokumentas sujungia `Homepage pakeitimai.docx` prašymus su konkrečiais failais/eilutėmis dabartiniame `bricks` kode. Kodas dar **nekeistas** — tai analizė prieš implementaciją.

## 1. Globalus terminų keitimas: "planas" → "prenumerata"

Doc punktai 2, 3, 7: `Planai → Prenumeratos`, `Prenumeruoti → Pradėk konstruoti`, ir visur `planas → prenumerata`.

Žodis „planas/planą/planai" pasitaiko **18 failų**: `Hero.tsx`, `Nav.tsx`, `FeaturedProducts.tsx`, `Plans.tsx`, `HowItWorks.tsx`, `ProductCard.tsx`, `WhatsInside.tsx`, `Footer.tsx`, `Breadcrumb.tsx`, `BigCTA.tsx`, `FAQ.tsx`, `Archive.tsx`, `Subscribe.tsx`, `Account.tsx`, `Checkout.tsx`, `Community.tsx`, `Drop.tsx`, `HelpPages.tsx`, `About.tsx`.

Tai nėra tik homepage kosmetika — pats kontekstas (`PlansContext.tsx`) ir komponentas `Plans.tsx` pavadinti pagal seną terminologiją. Reikės nuspręsti apimtį:
- **Minimum (tik homepage tekstas):** pakeisti matomus UI tekstus (`Nav.tsx` 142 eil. „Planai" → „Prenumeratos"; 153 eil. `Prenumeruoti` CTA → „Pradėk konstruoti"; 219 eil. analogiškai).
- **Pilnas (rekomenduojama nuoseklumui):** pervadinti ir vidinius identifikatorius (`PlansContext` → `SubscriptionsContext`, maršrutus, props) — didesnis refaktorius, palies admin sinchronizaciją, jei terminai bendri.

Nav.tsx konkrečiai:
- 142 eil. — `Planai` (meniu punktas) → `Prenumeratos`
- 153 eil. — `<Link to="/subscribe">Prenumeruoti` → CTA tekstas keičiasi į „Pradėk konstruoti"
- 219 eil. — analogiškas CTA kitoje vietoje (mobile meniu?) — tas pats keitimas

## 2. Hero sekcija (`src/components/Hero.tsx`)

- 154 eil. — „Prenumerata" jau atitinka naują terminą (nekeisti).
- 164 eil. — dabartinis tekstas: *„Nuomokis išskirtinius rinkinius su mėnesine prenumerata. Pasirink planą, išsirink norimą rinkinį, gauk jį į namus ar paštomatą, surink ir keisk į naują kada panorėjęs."*
  → keičiamas į: *„Konstruok įspūdingiausius originalius LEGO® rinkinius be didelių išlaidų. Pasirink prenumeratą, išsirink norimą rinkinį, mėgaukis konstravimo procesu ir, baigęs, rinkis kitą projektą."* (doc 11 eil.)
- Doc 5 eil.: „vietoj suaugusiems → visiems" — Hero.tsx šio tikslaus žodžio neturi; reikia patikrinti, ar tai kitoje sekcijoje (galimai `WhatsInside.tsx` ar paveikslėlyje/antraštėje, kurios grep nerado tekstiniu pavidalu — gali būti SVG arba paveikslėlyje įdegintas tekstas). **Reikia patikslinti su klientu, kur tiksliai yra šis sakinys** — dokumento nuotraukose (image1–16.png) tikriausiai yra ekrano kopija su pažymėta vieta; verta peržiūrėti originalų docx vizualiai.
- Doc 13 eil.: „→ peržiūrėti rinkinius" — tikriausiai CTA mygtuko tekstas Hero sekcijoje; reikia identifikuoti konkretų mygtuką (Hero.tsx pilnas failas neperžiūrėtas iki galo šioje analizėje).

## 3. WhatsInside sekcija (`src/components/WhatsInside.tsx`)

- 26 eil. — `title: 'Nauji rinkiniai kas mėnesį'` → keisti į savaitinį ritmą: *„naujas rinkinys kas savaitę. Konstruok. Keisk. Kartok. Nemokamas pristatymas"* (doc 14 eil.). Reikia perrašyti visą „running sentence" bloką, ne tik antraštę.

## 4. Archive / katalogo puslapis (`src/pages/Archive.tsx`)

Doc 16–70 eil. apima filtrus. Reikia:
- Sekcijos pavadinimas → `TEMA` ir `VISOS TEMOS` (16 eil.).
- Temų filtrų sąrašas (18–38 eil. doc'e) — patikrinti, ar `Archive.tsx` šiuo metu turi šį pilną temų sąrašą (Architektūra, Creator 3in1, Dekoracijos, Disney, Dreamz, Harry Potter, Icons, Ideas, Marvel, Minecraft, Minifigūrėlės, Pokemonai, Star Wars, Technic, Batman, City, Jurassic World, Super Mario, Creator Expert, Kita) — nebuvo rasta grep'e, greičiausiai temos šiuo metu generuojamos iš `products.ts`/duomenų failo, o ne hardcoded — reikia patikrinti duomenų šaltinį.
- „Filtrai pagal prenumeratą" (41 eil. doc) — dabar veikiausiai vadinasi „Filtrai pagal planą". Reikia pervadinti pačias kategorijas: `Mėgėjas / Kūrėjas / Meistras / Legenda / Mystery Box S / Mystery Box M` — **tai skiriasi nuo CLAUDE.md aprašytų tier'ų (Nano/Mini/Standard/Pro/Mega)**. Reikia patvirtinti su klientu, ar tai naujas oficialus tier'ų pavadinimų rinkinys, kuris turėtų pakeisti Nano/Mini/Standard/Pro/Mega visur sistemoje (įsk. `PlansContext.tsx`, admin), ar tik šio filtro etiketės.
- Amžiaus filtras 7+–18+ (48–60 eil.) — 260 eil. `Archive.tsx` jau turi `label="Amžius"`; reikia patikrinti, ar visos reikšmės (7+ … 18+) jau yra, ar trūksta kraštinių.
- Rikiavimas (63–68 eil.): `Populiariausi / Naujausi / Daugiausia detalių / Mažiausia detalių / Laisvi dabar` — `Archive.tsx` 52 eil. turi `Rūšiuoti: {label}` — reikia patikrinti pilną `options` sąrašą atitinka šiuos 5 punktus, ypač „Laisvi dabar" (tik šiuo metu prieinami) — tai gali reikalauti naujo filtro lauko duomenyse (`available`/`inStock`), ne vien UI teksto.

## 5. „Kaip tai veikia" (`src/components/HowItWorks.tsx`)

Dabartinis turinys (9–22 eil.):
1. „Pasirink planą" / *„Pasirink planą pagal savo biudžetą ir statymo lygį — kuo didesnis planas, tuo daugiau pasirinkimo."*
2. „Išsirink rinkinį" / *„Išsirink rinkinį pagal savo pasirinktą planą — nuo mažesnių modelių iki kolekcinių projektų."*
3. „Grąžink, keišk, atrask" / *„Grąžink rinkinius ir pasiimk naujus iš katalogo — be papildomų mokesčių."*

Nauji tekstai (doc 72–103 eil.):
- Antraštė: `KAIP TAI VEIKIA?` / `PRADĖK KONSTRUOTI` / *„Vos keli paprasti žingsniai iki naujo konstravimo projekto tavo namuose."*
- 1. „Pasirink prenumeratą" / *„Pasirink prenumeratą pagal savo poreikius – kiekviena jų atveria skirtingas LEGO® rinkinių galimybes."*
- 2. „Išsirink rinkinį" / *„Išsirink LEGO® rinkinį, kuris labiausiai įkvepia, o mes pasirūpinsime jo pristatymu."*
- 3. „Grąžink, keisk, kartok" / *„Baigęs konstruoti, grąžink rinkinį ir pasiruošk kitam LEGO® projektui."*
- Papildoma antraštė: `LAISVĖ KONSTRUOTI.` / *„Jokių ilgalaikių įsipareigojimų, nemokamas pristatymas ir prenumerata, prisitaikanti prie tavo konstravimo tempo. Kiekvieną mėnesį atrask naujus LEGO® konstravimo projektus."*
- 4 nauji „feature" blokai su numeracija 01–04:
  - 01 NEMOKAMAS PRISTATYMAS — *„Visus LEGO® rinkinius pristatome nemokamai visoje Lietuvoje."*
  - 02 KONSTRUOK SAVO TEMPU — *„Rinkinius gali laikyti tiek, kiek reikia – kol tavo prenumerata aktyvi."*
  - 03 JOKIŲ ILGALAIKIŲ ĮSIPAREIGOJIMŲ — *„Keisk prenumeratą, pristabdyk ją arba nutrauk tada, kai tau patogu."*
  - 04 NAUJI RINKINIAI KIEKVIENĄ SAVAITĘ — *„Katalogą nuolat papildome naujais LEGO® rinkiniais. Sek naujienas ir pirmasis atrask naujausius papildymus."*

Šis blokas šiuo metu turi tik 3 žingsnius be papildomų 01–04 kortelių — reikės **naujos UI struktūros**, ne vien teksto keitimo (galimai pridėti naują subsekciją po esamais žingsniais).

## 6. FAQ sekcija (`src/components/FAQ.tsx`)

Dabartinė FAQ turi tik **5 klausimus**, statiškai rodomus (be „rodyti daugiau"). Kliento dokumente — **20 klausimų-atsakymų** (doc 107–171 eil.), su instrukcija: *„Palikti 8 klausimus matomus, o likusius paslėpti, kad galėtų išskleisti ir pamatyti plačiau."*

Tai reiškia:
- Reikia pakeisti visą `faqs` masyvą (11–32 eil.) naujais 20 punktų.
- Reikia naujos UI logikos — „show more/less" mygtukas po 8-o klausimo (šiuo metu tokios logikos nėra, `Accordion` tiesiog rodo visus).
- CTA plytelė tame pačiame komponente (152–187 eil., „Vis dar abejoji?") atitinka doc 174–179 eil.:
  - Antraštė „Naujausi Lego Rinkiniai" → **„NEBESIRIBOK – KONSTRUOK!"**
  - Pastraipa *„Pasirink planą, išsirink norimus modelius..."* → **„Prisijunk prie Brick Time ir atrask įspūdingiausius LEGO® rinkinius be didelių išlaidų."**
  - Mygtukas „Pasirinkti planą →" → **„Pasirinkti prenumeratą"**

## 7. Footer (`src/components/Footer.tsx`)

- Po logotipo esantis tekstas → *„Pirmoji originalių LEGO® rinkinių prenumerata Lietuvoje. Konstruok daugiau, atrask naujus projektus ir mėgaukis LEGO® be didelių išlaidų."* (doc 181 eil.) — reikia patikrinti, ar dabar yra kitoks tekstas ten (nebuvo grep'e rastas tiksliai, reikia atverti failą pilnai).
- Soc. tinklų nuorodos — patikrinti, kad būtų Facebook, Instagram, TikTok (doc 182 eil.).
- Stulpelių sąrašai jau sutampa su kodu:
  - 1 stulpelis „ATRASK": `Rinkiniai`, `Bendruomenė`, `Dovanų kortelės` jau yra (7–9 eil.) — trūksta **„Prenumeratos"** punkto (doc reikalauja `Prenumeratos / Rinkiniai / Bendruomenė / Dovanų kortelės`).
  - 2 stulpelis „PAGALBA": `D.U.K.` jau yra (12 eil.) — patikrinti, ar yra `Kontaktai`.
  - 3 stulpelis „ĮMONĖ": `Apie mus`, `Merch` jau yra (17–18 eil.) ✓.
- Copyright eilutė → `© 2026 Brick Time MB.` + LEGO® prekės ženklo disclaimeris (doc 203–204 eil.) — reikia patikrinti, ar disclaimeris jau yra footer'yje; jei ne, **privaloma pridėti** (teisininkų reikalavimas, žr. #8).

## 8. Teisiniai / compliance reikalavimai (nauji, ne vien teksto redagavimas)

Tai skiriasi nuo kosmetinių pakeitimų — reikalauja naujos logikos/šablonų:

1. **Trūkstamos detalės pranešimas prieš nuomą/apmokėjimą** (doc 206–207 eil.) — sakinys *„Jeigu konstruodamas pastebėsi, kad rinkinyje trūksta detalės, prieš grąžindamas rinkinį būtinai pranešk apie tai savo Brick Time paskyroje..."* turi būti gerai matomoje vietoje **prieš checkout/subscribe patvirtinimą**. Reikia pridėti į `Subscribe.tsx` ir/ar `Checkout.tsx` prieš patvirtinimo mygtuką.
2. **PDF instrukcijos žymėjimas admin'e** (doc 208 eil.) — naujas laukas produkto redagavime (`admin/.../ProductEditDialog.tsx`), pvz. checkbox „Naudojama PDF instrukcija". Tai admin funkcionalumas, ne homepage.
3. **Prenumeratų lentelė pašalinta iš homepage** (doc 210 eil.) — patvirtinti, kad `Plans.tsx` (naudojamas Home.tsx) nebėra rodomas su pilnais aprašymais; jei šiuo metu Home.tsx rodo pilną palyginimo lentelę, ją reikia pašalinti/supaprastinti iki nuorodos į `/plans`.
4. **Amžiaus įspėjimas kiekviename rinkinio apraše ir prieš checkout** (doc 212 eil.): *„Svarbu: LEGO® rinkinyje yra smulkių detalių, todėl jis netinka vaikams iki 3 metų..."* — pasiūlymas: įtraukti į produkto aprašymo šabloną (`Drop.tsx` ir/ar produkto duomenų struktūrą), kad rodytųsi automatiškai, ne rankiniu būdu kiekvienam produktui.
5. **EN 71-6 amžiaus ženklinimo simbolis (SVG)** kiekviename rinkinyje (doc 214 eil.) — reikės SVG assets ir automatinio rodymo produkto kortelėje/aprašyme, analogiškai #4.
6. **LEGO® prekės ženklo disclaimeris kiekviename rinkinio apraše** (doc 216 eil.) — tas pats sakinys kaip footer'yje, bet pakartotas prie kiekvieno produkto — irgi šablonizuojamas produkto aprašymo komponente.
7. **Atviras klausimas klientui, ne implementacijos punktas** (doc 218 eil.): *„kaip klientas matys, kad detalės sutikrintos po grąžinimo?"* — tai reikalauja produkto/UX sprendimo (pvz. statuso ženkliukas paskyroje: „Tikrinama" → „Patvirtinta"), o ne vien teksto keitimo. **Reikia sprendimo prieš implementaciją**, nes paliečia `Account.tsx`, order/return duomenų modelį ir galimai admin darbo eigą.

## Rekomenduojama tolimesnė eiga

1. Patvirtinti su klientu neaiškius punktus: Hero „vietoj suaugusiems→visiems" tikslią vietą, tier pavadinimų (Mėgėjas/Kūrėjas/Meistras/Legenda) santykį su esamais Nano/Mini/Standard/Pro/Mega, ir grąžinimo patikros statuso UX.
2. Suskirstyti darbą į du takelius: (a) tekstiniai/kopijos pakeitimai (Hero, WhatsInside, HowItWorks, FAQ, Footer, Nav) — santykinai greita; (b) struktūriniai/compliance pakeitimai (FAQ show-more, HowItWorks 01–04 kortelės, „Laisvi dabar" filtras, amžiaus žymėjimas ir LEGO disclaimeris produkto šablone, missing-parts pranešimas prieš checkout) — reikalauja naujo UI ir galimai duomenų modelio pakeitimų.
3. Po patvirtinimo galiu tiesiogiai implementuoti pakeitimus faile po failo.
