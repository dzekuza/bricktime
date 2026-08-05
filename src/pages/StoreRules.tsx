import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { Seo } from "@/components/Seo"

type Section = {
  id: string
  title: string
  body: string[]
  bullets?: string[]
}

const sections: Section[] = [
  {
    id: "bendrosios-nuostatos",
    title: "1. Bendrosios nuostatos",
    body: [
      "Šios elektroninės parduotuvės www.bricktime.lt paslaugų užsakymo tvarka ir taisyklės (toliau – „Taisyklės“) nustato bendrąsias naudojimosi BRICKTIME internetine parduotuve www.bricktime.lt sąlygas. Taisyklės yra taikomos, kai Pirkėjas renkasi, užsako ir perka BRICKTIME elektroninėje parduotuvėje siūlomas paslaugas (įsigyja prenumeratą) ar bet kaip kitaip naudojasi BRICKTIME interneto svetainės teikiamomis paslaugomis.",
      "Santykiai, kurių nereglamentuoja šios Taisyklės arba reglamentuoja juos tik iš dalies, reguliuojami Lietuvos Respublikos teisės aktų nustatyta tvarka.",
      "BRICKTIME elektroninėje parduotuvėje paslaugų teikimą organizuoja, vykdo ir su ja susijusias paslaugas Pirkėjui teikia MB „Brick time“, juridinio asmens kodas 307611342, buveinės adresas: Pasakų g. 10-1, Vilnius, tel. +370 682 11695, el. p. info@bricktime.lt (toliau – „Pardavėjas“). BRICKTIME elektroninėje parduotuvėje parduodamos BRICKTIME teikiamos paslaugos – LEGO® rinkinių prenumeratos.",
      "Pirkėju šiose Taisyklėse yra bet kuris asmuo, perkantis BRICKTIME elektroninėje parduotuvėje ar besinaudojantis kitomis BRICKTIME elektroninės parduotuvės paslaugomis. Naudotis BRICKTIME elektronine parduotuve ir joje pirkti turi teisę veiksnūs fiziniai asmenys, ne jaunesni nei 18 metų, ir juridiniai asmenys, veikiantys per įgaliotus atstovus.",
      "Pateikdamas užsakymą (užsisakęs prenumeratą) Pirkėjas besąlygiškai patvirtina, jog jis turi teisę pirkti BRICKTIME elektroninėje parduotuvėje.",
      "Kartu su Pirkėjo pateiktu užsakymu šios Taisyklės tampa tarp Pirkėjo ir Pardavėjo sudaryta nuotoline paslaugų teikimo sutartimi ir yra abiem šalims privalomas teisinis dokumentas. Sutartis laikoma sudaryta, kai Pirkėjas suformuoja ir pateikia užsakymą, atlieka pradinį apmokėjimą ir Pardavėjas išsiunčia patvirtinimą, kad užsakymas priimtas. Pirkėjas supranta ir sutinka, kad prenumeratos užsakymas sukelia tęstinius ir periodiškai atsinaujinančius finansinius įsipareigojimus.",
      "Pirkėjui nesuteikiama galimybė pateikti užsakymo, jeigu jis nėra susipažinęs su Taisyklėmis ir (ar) kitomis BRICKTIME elektroninėje parduotuvėje esančiomis tvarkomis, politikomis, ir (ar) su jomis nesutinka. Užsisakius paslaugas laikoma, jog Pirkėjas susipažino ir besąlygiškai sutiko su Taisyklėmis.",
      "Pardavėjas pasilieka teisę vienašališkai pakeisti, taisyti ar papildyti Taisykles bei prenumeratų kainas. Esamiems prenumeratoriams apie pasikeitimus, galinčius turėti įtakos jų prenumeratos sąlygoms, pranešama el. paštu ne vėliau kaip prieš 14 kalendorinių dienų iki pakeitimų įsigaliojimo. Pirkėjui nesutinkant su pakeitimais, jis turi teisę nutraukti prenumeratą iki naujųjų Taisyklių ar kainų įsigaliojimo dienos.",
      "Pardavėjas neprisiima jokios rizikos ar atsakomybės, jei Pirkėjas iš dalies ar visiškai nesusipažino su Taisyklėmis, nors jam tokia galimybė buvo suteikta.",
      "Pardavėjas, atsižvelgdamas į sistemos techninius pajėgumus, turi teisę riboti registruotų Pirkėjų skaičių, taip pat be įspėjimo apriboti Pirkėjo naudojimąsi paslaugomis arba panaikinti registraciją ir (ar) prenumeratą, jeigu Pirkėjas pažeidžia Taisykles ar bando pakenkti svetainės saugumui.",
      "Pardavėjas gali laikinai arba iš viso nutraukti BRICKTIME elektroninės parduotuvės veiklą dėl techninės priežiūros ar atnaujinimo darbų. Jei veikla ar paslaugų teikimas visiškai nutraukiamas, Pardavėjas įsipareigoja įvykdyti jau apmokėtus užsakymus arba proporcingai grąžinti pinigus už likusį ir nepasinaudotą prenumeratos laikotarpį. Įvykus force majeure aplinkybėms, Pardavėjas turi teisę sustabdyti sutarties vykdymą, apie tai pranešdamas Pirkėjui.",
      "Pardavėjui priklauso visos autorinės teisės, teisės į duomenų bazes, prekių ženklus ir kitos intelektinės nuosavybės teisės į BRICKTIME interneto svetainės medžiagą. Pirkėjai gali naudotis šia medžiaga tik informaciniais ir asmeniniais nekomerciniais tikslais. Draudžiama be išankstinio raštiško sutikimo naudoti BRICKTIME pavadinimą, kopijuoti, platinti ar pritaikyti Intelektinės nuosavybės objektus komerciniais tikslais.",
    ],
  },
  {
    id: "registracija-ir-duomenys",
    title: "2. Registracija ir asmens duomenų tvarkymas",
    body: [
      "Pateikti užsakymus BRICKTIME elektroninėje parduotuvėje turi teisę tik registruoti Pirkėjai. Norėdamas tapti registruotu Pirkėju, asmuo privalo pateikti vardą, el. pašto adresą, sukurti slaptažodį bei susipažinti su Privatumo politika.",
      "Pirkėjas yra atsakingas, kad jo pateikti duomenys būtų tikslūs, teisingi ir išsamūs, ir privalo juos nedelsdamas atnaujinti, jiems pasikeitus. Pirkėjas turi teisę bet kuriuo momentu keisti, papildyti ar panaikinti savo registraciją (paskyrą).",
      "Registruodamasis Pirkėjas susikuria individualius prisijungimo duomenis ir įsipareigoja juos saugoti paslaptyje. Pirkėjas yra atsakingas už bet kuriuos veiksmus, atliekamus prisijungus jo el. pašto adresu ir slaptažodžiu. Praradus prisijungimo duomenis, būtina nedelsiant informuoti Pardavėją.",
      "Norėdamas pateikti užsakymus, Pirkėjas privalo pateikti papildomus duomenis: telefono numerį, pristatymo adresą (arba pasirinkto paštomato duomenis) bei atsiskaitymo informaciją.",
      "Pirkėjo asmens duomenys tvarkomi Pirkėjo identifikavimui, sutarties sudarymui ir vykdymui, apskaitos dokumentų išrašymui, lėšų nurašymo ir grąžinimo administravimui, įsiskolinimų ar materialinės žalos valdymui bei tiesioginei rinkodarai (tik gavus atskirą sutikimą).",
      "Pardavėjas įsipareigoja laikytis konfidencialumo ir tvarkyti duomenis pagal BDAR bei Lietuvos Respublikos teisės aktų reikalavimus. Duomenys gali būti perduoti tik Pardavėjo partneriams, teikiantiems logistikos, mokėjimų surinkimo (pvz., Stripe, Satispay) bei buhalterinės apskaitos paslaugas.",
      "Pardavėjas turi teisę apriboti, sustabdyti arba blokuoti Pirkėjo paskyrą, jei Pirkėjas pažeidžia Taisykles, laiku nesumoka prenumeratos mokesčio, tyčia gadina ar negrąžina LEGO® rinkinių. Apie tai Pirkėjas informuojamas el. paštu per 1 darbo dieną nuo ribojimų pritaikymo.",
    ],
  },
  {
    id: "uzsakymas-kainos-apmokejimas",
    title: "3. Paslaugų užsakymas, kainos, apmokėjimo tvarka",
    body: [
      "Paslaugų (prenumeratų) kainos nurodomos eurais su įskaičiuotais visais taikomais mokesčiais. Į prenumeratos kainą įskaičiuotas LEGO® rinkinių pristatymas ir grąžinimas, jei svetainėje nenurodyta kitaip.",
      "Pardavėjas turi teisę keisti prenumeratų kainas – naujos kainos taikomos naujiems užsakymams nuo paskelbimo dienos. Esamiems prenumeratoriams pranešama el. paštu prieš 14 kalendorinių dienų iki kito periodinio mokėjimo nurašymo.",
      "Pirkėjas atsiskaito mokėjimo kortelėmis, Apple Pay, Google Pay arba per Satispay programėlę. Mokėjimo operacijos atliekamos sertifikuoto paslaugos teikėjo saugiame serveryje – BRICKTIME sistemoje kortelės duomenys nesaugomi.",
      "Įsigydamas prenumeratą, Pirkėjas suteikia teisę Pardavėjui ir mokėjimų partneriui „Stripe“ automatiškai ir reguliariai (kas mėnesį) nurašyti nustatyto dydžio prenumeratos mokestį be atskiro patvirtinimo kiekvieno nurašymo metu.",
      "Paslaugų užsakymas patvirtinamas ir prenumerata aktyvuojama tik sėkmingai autorizavus pradinį mokėjimą. Jei periodinio mokėjimo dieną nepavyksta nurašyti mokesčio, „Stripe“ automatiškai kartoja bandymą; nepavykus – prenumerata laikinai sustabdoma. Jei mokėjimas neatliekamas per 5 kalendorines dienas, užsakymas anuliuojamas.",
      "Atlikus mokėjimą, sistema automatiškai sugeneruoja ir el. paštu išsiunčia sąskaitą-faktūrą. Oficialus mokėjimų tvarkymo partneris – „Stripe“ (Stripe Technology Europe, Limited), užtikrinantis PCI-DSS duomenų saugumo standartus.",
    ],
  },
  {
    id: "dovanu-kuponai",
    title: "4. Dovanų kuponų įsigijimas",
    body: [
      "BRICKTIME svetainėje galima įsigyti elektroninius Dovanų kuponus, pateikiamus nurodytu el. paštu PDF ar kitu skaitmeniniu formatu. Kupono nominalas gali būti pasirinktas iš fiksuotų verčių arba įvedant bet kokią sumą.",
      "Dovanų kuponas yra nevardinis ir suteikia teisę jį pateikusiam asmeniui apmokėti prenumeratos užsakymus už nurodytą sumą. Kuponas galioja 6 mėnesius nuo įsigijimo dienos, nebent kupone nurodyta kitaip.",
      "Vienu kuponu galima atsiskaityti tik vieną kartą, po to kodas anuliuojamas. Jeigu užsakymo suma mažesnė už kupono nominalą, likusi suma nėra išgryninama, tačiau gali būti perkeliama į paskyros balansą ir panaudojama būsimiems mokesčiams dengti.",
      "Dovanų kuponas negali būti keičiamas į grynuosius pinigus, pratęsiamas ar nemokamai išduodamas iš naujo, išskyrus atvejus, kai Pirkėjas pasinaudoja įstatymine teise atsisakyti sutarties per 14 dienų nuo įsigijimo (jei kuponas dar nepanaudotas).",
      "Kuponu negali būti apmokamas joks kitas BRICKTIME dovanų kuponas. Kuponus klastoti, kopijuoti, dauginti ar naudoti neteisėtu būdu griežtai draudžiama – tokiu atveju Pardavėjas turi teisę panaikinti paskyrą ir anuliuoti kuponą.",
      "Aktyvavus tęstinę prenumeratą Dovanų kuponu, pasibaigus kupono padengtam laikotarpiui, prenumerata automatiškai pratęsiama kitam mėnesiui. Norint išvengti tolesnių nurašymų, prenumeratą reikia atšaukti paskyroje prieš pasibaigiant kupono galiojimui.",
    ],
  },
  {
    id: "paslaugu-teikimo-salygos",
    title: "5. Pagrindinės paslaugų teikimo (prenumeratų) sąlygos",
    body: [
      "Prenumerata veikia kalendorinio mėnesio rotacijos principu: Pirkėjas per 1 mėnesį nuo aktyvavimo turi teisę pasirinkti, gauti ir nustatyta tvarka pasikeisti atitinkamo dydžio ir kategorijos LEGO® rinkinį pagal savo plano sąlygas.",
      "BRICKTIME elektroninėje parduotuvėje galima rinktis prenumeratos lygius: „MĖGĖJAS“, „KŪRĖJAS“, „MEISTRAS“, „LEGENDA“, „MYSTERY BOX MĖGĖJAMS“ ir „MYSTERY BOX KŪRĖJAMS“. Aktualios sąlygos, keitimo terminai bei kainos pateikiami adresu bricktime.lt/subscribe.",
      "Praėjus 1 mėnesiui nuo įsigijimo (ar paskutinio pratęsimo), prenumerata automatiškai pratęsiama kitam laikotarpiui, kol Pirkėjas jos neatšaukia ar nepakeičia. Pirkėjas gali bet kuriuo metu pakeisti savo prenumeratos planą savo paskyroje.",
      "Sumažinus prenumeratos lygį, už einamąjį mėnesį sumokėti pinigai negrąžinami, o naujas lygis įsigalioja nuo kito atsiskaitymo laikotarpio; anksčiau gauti rinkiniai turi būti grąžinti iki naujo laikotarpio pradžios. Padidinus lygį, aukštesnis planas aktyvuojamas iš karto sumokėjus proporcingą kainos skirtumą, jei nėra negrąžintų rinkinių.",
      "Pirkėjui per mėnesį leidžiama užsisakyti tik tokį LEGO® rinkinių kiekį ir tūrį, kurį numato jo prenumeratos planas. Priklausomai nuo plano, Pirkėjui suteikiamas virtualių „Briksių“ kreditų kiekis, leidžiantis užsisakyti papildomus rinkinius: S – 100, M – 200, L – 300, P – 400 briksių. Nutraukus prenumeratą, likę „Briksiai“ anuliuojami ir į pinigus nekeičiami.",
      "LEGO® rinkinio patikra ir atsakomybė už trūkstamas detales. Pastebėjęs trūkstamą detalę, Pirkėjas privalo užpildyti trūkumų formą savo paskyroje. Priešingu atveju laikoma, kad rinkinys buvo pristatytas pilnos komplektacijos. Jei Pardavėjas, patikrinęs grąžintą rinkinį, užfiksuoja trūkumą, apie kurį Pirkėjas nepranešė, Pirkėjas atsako už jį ir įsipareigoja padengti detalės įsigijimo bei pristatymo kainą.",
      "Pardavėjas, užfiksavęs trūkumus, el. paštu pateikia sąrašą ir apskaičiuotą žalą. Per 3 darbo dienas negrąžinus detalių ar nepateikus prieštaravimų, Pirkėjas suteikia sutikimą žalos sumą nurašyti automatiškai. Nepavykus nurašyti ar Pirkėjui atsisakius padengti nuostolius, Pardavėjas turi teisę sustabdyti prenumeratą. Detalių kainos nustatomos pagal bricklink.com ir lego.com duomenis.",
      "Grąžinus rinkinį, Pardavėjas patikrina jį per 3 darbo dienas. Be trūkumų grąžintas rinkinys pažymimas Pirkėjo paskyroje ir suteikiama teisė rinktis kitą rinkinį.",
      "Visi Pirkėjui pateikiami LEGO® rinkiniai, pakuotės ir instrukcijos išlieka Pardavėjo nuosavybe. Pirkėjui suteikiama tik laikina teisė asmeniniais, nekomerciniais tikslais naudotis gautais rinkiniais prenumeratos galiojimo metu – juos parduoti, pernuomoti, keisti ar perleisti tretiesiems asmenims draudžiama.",
      "Pardavėjas atleidžiamas nuo atsakomybės už laikinus paslaugų sutrikimus, kilusius dėl Pirkėjo kaltės, trečiųjų šalių veiksmų ar force majeure aplinkybių.",
    ],
  },
  {
    id: "rinkiniu-naudojimas",
    title: "6. LEGO® rinkinių naudojimo tvarka",
    body: [
      "Prieš naudodamas LEGO® rinkinį, Pirkėjas privalo susipažinti su pridedama instrukcija ir jos laikytis. Pardavėjas neatsako už žalą, kilusią dėl to, kad Pirkėjas nesilaikė oficialių LEGO® saugumo ir naudojimo instrukcijų.",
      "Rinkinys turi būti naudojamas rūpestingai, saugant jį nuo sugadinimo, praradimo ar perteklinio nusidėvėjimo, kad juo vėliau galėtų naudotis kiti Pirkėjai.",
      "Grąžinamas rinkinys privalo būti visiškai išardytas į atskiras detales ir sudėtas į vieną maišiuką transportavimo dėžėje. Grąžinti pilnai ar dalinai sukonstruotų modelių negalima. Popierinės instrukcijos turi būti saugomos nuo sugadinimo ir grąžinamos kartu su rinkiniu, taip pat visi papildomi priedai (skyriklis, atsarginės detalės ir kt.).",
      "Higienos ir saugumo reikalavimai. Draudžiama detales plauti indaplovėje, skalbimo mašinoje, virinti ar naudoti agresyvias valymo priemones. Jei rinkinys grąžinamas akivaizdžiai užterštas ar sugadintas, Pardavėjas turi teisę reikalauti papildomo valymo mokesčio arba taikyti žalos atlyginimo tvarką.",
      "Pirkėjas turi teisę laikyti gautą rinkinį neribotą laiką, kol prenumerata aktyvi ir mokesčiai sėkmingai nurašomi. Gautus rinkinius ar jų dalis griežtai draudžiama skolinti, dovanoti, pernuomoti ar kitaip perleisti tretiesiems asmenims.",
      "Pirkėjas, kurio vardu sudaryta sutartis, yra visiškai ir asmeniškai atsakingas už gautų rinkinių, pakuočių, instrukcijų bei detalių būklę, tinkamą naudojimą ir savalaikį grąžinimą.",
    ],
  },
  {
    id: "sutarties-atsisakymas",
    title: "7. Sutarties atsisakymas, paslaugų keitimas ir atšaukimas",
    body: [
      "Vadovaujantis Lietuvos Respublikos civilinio kodekso 6.228¹⁰ straipsniu, Pirkėjas (vartotojas) turi teisę per 14 dienų nuo sutarties sudarymo jos atsisakyti, nenurodydamas priežasties. Jei paslauga jau buvo pradėta teikti (rinkinys išsiųstas), Pirkėjas privalo savo lėšomis grąžinti jį idealios būklės, o Pardavėjas grąžina sumokėtus pinigus, atskaitęs sumą už faktiškai suteiktą laikotarpį bei siuntimo išlaidas.",
      "Reguliarios prenumeratos nutraukimas (atšaukimas). Pirkėjas turi teisę bet kuriuo metu nemokamai atšaukti prenumeratą ateities periodams, savo paskyroje arba el. paštu info@bricktime.lt, likus ne mažiau kaip 3 darbo dienoms iki kito nurašymo. Nutraukus prenumeratą mėnesio viduryje, pinigai už likusias dienas negrąžinami, o paslauga galioja iki mėnesio pabaigos. Pasibaigus laikotarpiui, rinkinys turi būti grąžintas per 2 darbo dienas.",
      "Jeigu Pardavėjas negali išsiųsti užsakyto rinkinio per 7 darbo dienas nuo apmokėjimo ir šalys nesutaria dėl alternatyvos, laikoma, kad paslauga negali būti suteikta – Pardavėjas grąžina visą sumokėtą sumą.",
      "Pinigų grąžinimas atliekamas per 14 kalendorinių dienų nuo sutarties nutraukimo ir (ar) fizinio rinkinio grąžinimo bei patikros dienos, į tą pačią mokėjimo priemonę, kuria buvo atliktas pradinis mokėjimas.",
      "Pradėjus, bet nebaigus ir neapmokėjus užsakymo proceso, nuotolinė paslaugų sutartis laikoma nesudaryta. Visiškai nutraukus prenumeratą ir (ar) ištrynus paskyrą, Pardavėjas nebeįsipareigoja išsaugoti užsakymų istorijos, „Briksių“ kreditų ar kitų duomenų – jie nėra perkeliami sukūrus naują paskyrą.",
    ],
  },
  {
    id: "apsikeitimas-informacija",
    title: "8. Apsikeitimas informacija",
    body: [
      "Pardavėjas visus pranešimus, susijusius su sutarties vykdymu, prenumeratos pratęsimu, mokėjimais ar pastebėtais detalių trūkumais, siunčia Pirkėjo registracijos ar užsakymo metu nurodytu el. paštu arba telefonu.",
      "Pirkėjas visus pranešimus, pretenzijas ir klausimus siunčia oficialiais Pardavėjo kontaktais: el. paštu info@bricktime.lt arba telefonu +370 682 11695.",
      "Šalys susitaria, kad el. paštu išsiųsti pranešimai laikomi gautais per 24 valandas nuo išsiuntimo, jei tai darbo diena, arba artimiausią darbo dieną, jei laiškas išsiųstas savaitgalį ar švenčių dienomis.",
    ],
  },
  {
    id: "baigiamosios-nuostatos",
    title: "9. Baigiamosios nuostatos",
    body: [
      "Šios Taisyklės sudarytos vadovaujantis Lietuvos Respublikos teisės aktais, kurie taikomi ir jų pagrindu kylantiems santykiams.",
      "Atsiradus žalai, kaltoji šalis atlygina kitai šaliai tiesioginius nuostolius teisės aktų nustatyta tvarka. Nesutarimai sprendžiami derybų būdu, o nepavykus susitarti – Lietuvos Respublikos įstatymų nustatyta tvarka.",
      "Kiekvienas Pirkėjas turi galimybę spręsti ginčus ne teismo tvarka: pirmiausia raštu kreiptis į Pardavėją (info@bricktime.lt), kuris įsipareigoja nemokamai išnagrinėti kreipimąsi ir pateikti motyvuotą atsakymą ne vėliau kaip per 14 kalendorinių dienų.",
      "Jeigu Pardavėjo atsakymas netenkina arba nepateikiamas laiku, Pirkėjas turi teisę kreiptis į Valstybinę vartotojų teisių apsaugos tarnybą (Vilniaus g. 25, 01402 Vilnius, el. p. tarnyba@vvtat.lt, tel. +370 5 262 6751, www.vvtat.lt) arba užpildyti prašymo formą Elektroninio vartotojų ginčų sprendimo (EGS) platformoje adresu ec.europa.eu/odr.",
    ],
  },
]

const contactRows = [
  ["Pardavėjas", "MB „Brick time“"],
  ["Juridinio asmens kodas", "307611342"],
  ["Adresas", "Pasakų g. 10-1, Vilnius"],
  ["Telefonas", "+370 682 11695"],
  ["El. paštas", "info@bricktime.lt"],
  ["Redakcija", "2026-07-16"],
]

export default function StoreRules() {
  return (
    <>
      <Seo
        title="Parduotuvės taisyklės"
        description="Brick Time elektroninės parduotuvės naudojimosi ir prenumeratos užsakymo taisyklės."
        path="/parduotuves-taisykles"
      />
      <Nav />
      <main className="bg-paper text-ink">
        <section className="pb-8">
          <div className="mx-auto max-w-[1320px] px-4 md:px-7">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <p className="label-mono text-ink/40">
                  Teisinė informacija / Taisyklės
                </p>
                <h1 className="heading-display text-d-xl mt-4 max-w-[14ch] tracking-[-0.015em] text-ink">
                  Parduotuvės
                  <br />
                  taisyklės
                </h1>
                <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-ink/70">
                  Elektroninės parduotuvės BRICKTIME paslaugų užsakymo tvarka ir
                  taisyklės – susipažink prieš užsisakydamas prenumeratą.
                </p>
              </div>

              <aside className="brick-card self-start bg-ink p-6 text-paper md:p-8">
                <p className="label-mono text-paper/50">Trumpai</p>
                <div className="mt-5 space-y-4">
                  {contactRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 border-b border-paper/12 pb-4 last:border-b-0 last:pb-0"
                    >
                      <span className="font-mono text-[12px] tracking-[0.08em] text-paper/45 uppercase">
                        {label}
                      </span>
                      {label === "El. paštas" ? (
                        <a
                          href={`mailto:${value}`}
                          className="text-[15px] leading-6 text-paper"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="text-[15px] leading-6 text-paper">
                          {value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="mx-auto grid max-w-[1320px] gap-5 px-4 md:px-7">
            {sections.map((section) => (
              <article
                key={section.id}
                className="brick-card bg-paper p-6 md:p-8"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <h2 className="heading-display text-d-xs text-ink">
                    {section.title}
                  </h2>
                  <a
                    href={`#${section.id}`}
                    className="font-mono text-[12px] tracking-[0.08em] text-ink/35 uppercase"
                  >
                    #{section.id}
                  </a>
                </div>

                <div id={section.id} className="mt-5 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[15px] leading-7 text-ink/74 md:text-[16px]"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && (
                    <ul className="grid gap-3 pt-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-3 text-[15px] leading-7 text-ink/74 md:text-[16px]"
                        >
                          <span className="mt-[11px] h-2.5 w-2.5 shrink-0 rounded-full border border-ink/25 bg-brand-yellow" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}

            <article className="brick-card bg-[#FFD731] p-6 md:p-8">
              <p className="label-mono text-ink/45">Kontaktai</p>
              <h2 className="heading-display text-d-xs mt-3 text-ink">
                Jei turite klausimų
              </h2>
              <p className="mt-4 max-w-[64ch] text-[15px] leading-7 text-ink/78 md:text-[16px]">
                Jei turėtumėte klausimų dėl šių taisyklių ar savo prenumeratos,
                susisiekite el. paštu{" "}
                <a
                  href="mailto:info@bricktime.lt"
                  className="font-bold text-ink underline underline-offset-4"
                >
                  info@bricktime.lt
                </a>{" "}
                arba telefonu{" "}
                <a
                  href="tel:+37068211695"
                  className="font-bold text-ink underline underline-offset-4"
                >
                  +370 682 11695
                </a>
                .
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
