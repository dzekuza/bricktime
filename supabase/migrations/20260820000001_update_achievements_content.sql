-- Update achievement copy/points to match new content (ids/icons/colors unchanged).
update achievements set
  label = 'Svečias',
  description = 'Apsilankyk Brick Time',
  points = 10
where id = 'daily_checkin';

update achievements set
  label = 'Komentatorius',
  description = 'Parašyk 10 komentarų',
  points = 20
where id = 'commenter';

update achievements set
  label = 'Fotografas',
  description = 'Pasidalink surinkto rinkinio nuotrauka',
  points = 30
where id = 'build_photo';

update achievements set
  label = 'Savaitės serija',
  description = 'Apsilankyk Brick Time 7 dienas iš eilės',
  points = 40
where id = 'week_streak';

update achievements set
  label = 'Mėgstamas',
  description = 'Surink iš viso 20 „patinka“ savo nuotraukoms',
  points = 50
where id = 'liker';

update achievements set
  label = 'Aktyvus komentatorius',
  description = 'Parašyk 50 komentarų',
  points = 60,
  category = 'social'
where id = 'collector_5';

update achievements set
  label = 'Konstravimo fanas',
  description = 'Pasidalink 5 surinktų rinkinių nuotraukomis',
  points = 75,
  category = 'social'
where id = 'drop_streak_3';

update achievements set
  label = 'Bendruomenės žvaigždė',
  description = 'Surink iš viso 100 „patinka“ savo nuotraukoms',
  points = 100,
  category = 'social'
where id = 'old_member';

update achievements set
  label = 'Veteranas',
  description = 'Būk Brick Time nariu ilgiau nei metus',
  points = 150,
  category = 'loyalty'
where id = 'first_drop';
