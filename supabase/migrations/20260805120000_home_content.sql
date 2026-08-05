-- Editable home/landing page content (headings, copy, images), managed from the
-- admin dashboard's new /content page. Seeded with the copy that was previously
-- hardcoded in Hero.tsx / HowItWorks.tsx / Testimonials.tsx / FAQ.tsx / data/faq.ts
-- so nothing changes visually on deploy.

create table public.home_content (
  id int primary key default 1 check (id = 1),
  hero_headline_line1 text not null default '',
  hero_headline_highlight text not null default '',
  hero_headline_line3 text not null default '',
  hero_subtext text not null default '',
  hero_cta_primary_label text not null default '',
  hero_cta_secondary_label text not null default '',
  hero_poster_url text,
  how_it_works_heading_line1 text not null default '',
  how_it_works_heading_highlight text not null default '',
  how_it_works_heading_line2 text not null default '',
  how_it_works_subtitle text not null default '',
  testimonials_heading_highlight text not null default '',
  testimonials_heading_line2 text not null default '',
  faq_cta_eyebrow text not null default '',
  faq_cta_line text not null default '',
  faq_cta_highlight text not null default '',
  faq_cta_body text not null default '',
  faq_cta_label text not null default '',
  faq_cta_href text not null default '',
  updated_at timestamptz not null default now()
);

create table public.home_how_it_works_steps (
  id uuid primary key default gen_random_uuid(),
  step_number text not null,
  title text not null,
  body text not null,
  brick_key text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.home_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  name text not null,
  meta text not null,
  avatar_color text not null,
  initials text not null,
  bg text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.home_faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.home_content enable row level security;
alter table public.home_how_it_works_steps enable row level security;
alter table public.home_testimonials enable row level security;
alter table public.home_faq_items enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['home_content', 'home_how_it_works_steps', 'home_testimonials', 'home_faq_items']
  loop
    execute format('create policy %I on public.%I for select using (true)', t || '_public_read', t);
    execute format(
      $f$create policy %I on public.%I for all
         using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
         with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))$f$,
      t || '_admin_write', t
    );
  end loop;
end $$;

insert into public.home_content (
  id,
  hero_headline_line1, hero_headline_highlight, hero_headline_line3, hero_subtext,
  hero_cta_primary_label, hero_cta_secondary_label,
  how_it_works_heading_line1, how_it_works_heading_highlight, how_it_works_heading_line2, how_it_works_subtitle,
  testimonials_heading_highlight, testimonials_heading_line2,
  faq_cta_eyebrow, faq_cta_line, faq_cta_highlight, faq_cta_body, faq_cta_label, faq_cta_href
) values (
  1,
  'Lego® Rinkinių', 'Prenumerata', 'Visiems',
  'Konstruok įspūdingiausius originalius LEGO® rinkinius be didelių išlaidų. Pasirink prenumeratą, išsirink norimą rinkinį, mėgaukis konstravimo procesu ir, baigęs, rinkis kitą projektą.',
  'Prenumeruoti', 'Peržiūrėti rinkinius',
  'Kaip tai veikia?', 'Pradėk', 'konstruoti', 'Vos keli paprasti žingsniai iki naujo konstravimo projekto tavo namuose.',
  'Klientų', 'Atsiliepimai.',
  'Vis dar abejoji?', 'Nebesiribok', 'Konstruok!',
  'Prisijunk prie Brick Time ir atrask įspūdingiausius LEGO® rinkinius be didelių išlaidų.',
  'Pasirinkti prenumeratą →', '#subscriptions'
);

insert into public.home_how_it_works_steps (step_number, title, body, brick_key, sort_order) values
  ('01', E'Pasirink\nprenumeratą', 'Pasirink prenumeratą pagal savo poreikius – kiekviena jų atveria skirtingas LEGO® rinkinių galimybes.', 'nano', 0),
  ('02', E'Išsirink\nrinkinį', 'Išsirink LEGO® rinkinį, kuris labiausiai įkvepia, o mes pasirūpinsime jo pristatymu.', 'standard', 1),
  ('03', E'Grąžink,\nkeisk, kartok', 'Baigęs konstruoti, grąžink rinkinį ir pasiruošk kitam LEGO® projektui.', 'mega', 2);

insert into public.home_testimonials (quote, name, meta, avatar_color, initials, bg, sort_order) values
  ('"Mano stalas virto mažu miestu. Produktas-26 pašto surinkimas — tai beprotybė."', 'Amelia R.', 'Prenumeratorė nuo produkto 04', '#FB4903', 'AR', '#5DDB9C', 0),
  ('"Mano vaikai mano, kad esu burtininkas. Surinkimo kortelės tiesiog nuostabios."', 'Marco T.', 'Legend lygis · 14 mėnesių', '#FFAEE7', 'MT', '#F5F1EB', 1),
  ('"Praleidau mėnesį, jokios dramos. Grįžau į koralinio rifo produktą. Tobula."', 'Yuki S.', 'Builder lygis', '#5DDB9C', 'YS', '#FFAEE7', 2),
  ('"Kiekvienas mėnuo — siurprizas. Mano kolegos jau pavydi."', 'Jonas K.', 'Pro lygis · 6 mėnesiai', '#FFD731', 'JK', '#ffffff', 3);

insert into public.home_faq_items (question, answer, sort_order) values
  ('Kaip veikia Brick Time?', 'Išsirink tau tinkamiausią prenumeratą ir pasirink LEGO® rinkinį pagal jos suteikiamas galimybes. Kiekvienam naujam prenumeratos laikotarpiui galėsi rinktis naujus rinkinius arba jų kombinacijas – priklausomai nuo pasirinktos prenumeratos.', 0),
  ('Kada prasideda mano prenumeratos laikotarpis?', 'Prenumeratos laikotarpis pradedamas skaičiuoti nuo tos dienos, kai aktyvuojama prenumerata, o ne nuo kalendorinio mėnesio pradžios.', 1),
  ('Kaip išsirinkti tinkamiausią prenumeratą?', 'Prenumeratos skiriasi pagal galimų rinkinių dydį, jų kombinacijas ir papildomas naudas. Palyginimo lentelėje lengvai matysi visus skirtumus, todėl galėsi išsirinkti geriausiai tavo poreikius atitinkantį variantą.', 2),
  ('Kas yra Briksiai?', 'Briksiai – tai Brick Time taškų valiuta. Juos gaunate su savo prenumerata, o jų kiekis priklauso nuo pasirinkto plano. Kiekvienas LEGO rinkinys turi savo Briksių vertę, todėl pagal sukauptus Briksius lengvai matysite, kuriuos rinkinius galite pasirinkti. Kuo aukštesnė prenumerata, tuo daugiau Briksių gaunate ir tuo didesnį rinkinių pasirinkimą turite.', 3),
  ('Ar galiu pasirinkti konkretų LEGO® rinkinį?', 'Taip. Galėsi pasirinkti bet kurį kataloge esantį LEGO® rinkinį, kuris priklauso tavo prenumeratos kategorijai. Išimtis – Mystery Box prenumeratos. Jas pasirinkus, rinkinį kiekvieną prenumeratos laikotarpį parinksime mes, todėl tavęs visada lauks maloni staigmena.', 4),
  ('Kiek laiko galiu laikyti LEGO® rinkinį?', 'Rinkinį gali laikyti tiek, kiek reikia – grąžinimo terminas nėra ribojamas. Svarbiausia, kad tavo prenumerata būtų aktyvi.', 5),
  ('Kaip vyksta grąžinimas?', 'Baigęs konstruoti, prisijunk prie savo Brick Time paskyros ir suformuok grąžinimą. Sistema sugeneruos visą grąžinimui reikalingą informaciją, o rinkinį grąžinsi tokiu pačiu būdu, kokiu jis buvo pristatytas – per LP EXPRESS paštomatą arba kurjerį.', 6),
  ('Ką daryti, jei konstruodamas pastebėjau, kad trūksta detalės?', 'Jeigu konstruodamas pastebėjai, kad rinkinyje trūksta vienos ar kelių detalių, prieš grąžindamas rinkinį prisijunk prie savo Brick Time paskyros ir užpildyk Trūkstamos detalės formą. Taip užfiksuosime informaciją ir užtikrinsime, kad už anksčiau trūkusias detales nebūsi laikomas atsakingu.', 7),
  ('Ar galiu pasirinkti daugiau LEGO® rinkinių tame pačiame prenumeratos laikotarpyje?', 'Ne. Kiekviena prenumerata suteikia galimybę per vieną prenumeratos laikotarpį pasirinkti joje numatytą rinkinių kiekį arba jų kombinaciją. Naujas pasirinkimas tampa prieinamas prasidėjus kitam prenumeratos laikotarpiui.', 8),
  ('Ar galiu rinkinius iš tos pačios prenumeratos užsisakyti atskirai?', 'Jeigu tavo prenumerata suteikia galimybę pasirinkti kelis LEGO® rinkinius arba jų kombinaciją, juos reikės pasirinkti ir užsisakyti vieno užsakymo metu. Atskirais užsakymais to paties prenumeratos laikotarpio metu rinkinių užsisakyti nebus galima.', 9),
  ('Ar prieš grąžindamas turiu išrinkti LEGO® rinkinį?', 'Taip. Prieš grąžinant prašome išrinkti LEGO® rinkinį ir sudėti detales į kartu su siunta pridėtą(-us) maišelį(-ius). Taip užtikrinamas saugus transportavimas, o mes galime kruopščiai patikrinti, ar rinkinyje yra visos detalės.', 10),
  ('Kas nutiks, jei apie trūkstamą detalę nepranešiu?', 'Jeigu prieš grąžindamas nepraneši apie trūkstamą detalę, o mūsų atliekamos patikros metu bus nustatyta, kad jos trūksta, bus laikoma, jog detalė dingo naudojimosi metu. Tokiu atveju atsakomybė už trūkstamą detalę teks prenumeratoriui.', 11),
  ('Ką daryti, jei pamečiau arba sugadinau LEGO® detalę?', 'Jeigu naudojantis rinkiniu pametei ar sugadinai detalę, kuo greičiau susisiek su mumis. Suprantame, kad tokių situacijų gali pasitaikyti, todėl kiekvieną atvejį vertiname individualiai ir kartu ieškome geriausio sprendimo.', 12),
  ('Kaip tikrinami LEGO® rinkiniai po grąžinimo?', 'Kiekvienas grąžintas LEGO® rinkinys kruopščiai patikrinamas ir surūšiuojamas į maišelius pagal oficialią LEGO® instrukciją. Taip užtikriname, kad kiekvienas kitas prenumeratorius gautų pilną, tvarkingą ir naujam konstravimo projektui paruoštą rinkinį.', 13),
  ('Per kiek laiko patikrinate grąžintą LEGO® rinkinį?', 'Gavę grąžintą LEGO® rinkinį, jį kruopščiai patikriname ir surūšiuojame pagal oficialią LEGO® instrukciją. Patikrą atliekame per 3 darbo dienas nuo siuntos gavimo. Jeigu patikros metu pastebėsime trūkstamų ar sugadintų detalių, susisieksime su tavimi.', 14),
  ('Ar visi LEGO® rinkiniai yra originalūs?', 'Taip. Visi Brick Time kataloge esantys rinkiniai yra originalūs LEGO®.', 15),
  ('Ar LEGO® rinkiniai pristatomi su instrukcija?', 'Taip. Kiekvienas LEGO® rinkinys pristatomas su originalia spausdinta LEGO® instrukcija.', 16),
  ('Ar galiu pakeisti, pristabdyti arba nutraukti prenumeratą?', 'Taip. Bet kuriuo metu galėsi pakeisti prenumeratą į kitą, ją pristabdyti arba nutraukti. Visus šiuos veiksmus galėsi atlikti savo Brick Time paskyroje.', 17),
  ('Kaip dažnai papildomas LEGO® rinkinių katalogas?', 'Katalogą reguliariai papildome naujais LEGO® rinkiniais. Svetainėje visada matysi laikmatį iki kito katalogo papildymo, todėl pirmasis sužinosi apie naujai pasirodžiusius rinkinius.', 18),
  ('Ar galiu padovanoti Brick Time prenumeratą?', 'Taip. Gali įsigyti Brick Time elektroninį dovanų kuponą ir padovanoti LEGO® konstravimo džiaugsmą savo artimiesiems ar draugams.', 19);

-- Down migration (manual rollback):
-- drop table public.home_faq_items;
-- drop table public.home_testimonials;
-- drop table public.home_how_it_works_steps;
-- drop table public.home_content;
