-- Store rules: plan changes, briksiai and cancellation, worded to match how
-- the service now behaves (flat upgrade gap, downgrade at next renewal if the
-- held sets fit, cancellation only after returns).
-- Apply only when that behaviour is live; existing subscribers must be told by
-- email at least 14 days before changed terms apply (store rules, section 1).
-- Rollback: swap the replace() arguments below back (new text to old text).

do $$
declare
  v_before text;
  v_after text;
begin
  select sections::text into v_before from public.legal_pages where slug = 'store_rules';
  if v_before is null then
    raise exception 'store_rules page not found';
  end if;

  v_after := v_before;

  v_after := replace(
    v_after,
    'Sumažinus prenumeratos lygį, už einamąjį mėnesį sumokėti pinigai negrąžinami, o naujas lygis įsigalioja nuo kito atsiskaitymo laikotarpio; anksčiau gauti rinkiniai turi būti grąžinti iki naujo laikotarpio pradžios. Padidinus lygį, aukštesnis planas aktyvuojamas iš karto sumokėjus proporcingą kainos skirtumą, jei nėra negrąžintų rinkinių.',
    'Padidinus prenumeratos lygį, aukštesnis planas aktyvuojamas iš karto: Pirkėjas iškart primoka visą kainų skirtumą (be skaičiavimo pagal dienas) ir iškart gauna papildomų „Briksių“, o nurašymo diena nesikeičia. Sumažinus prenumeratos lygį, naujas lygis įsigalioja tik nuo kito nuskaitymo dienos, už einamąjį laikotarpį sumokėti pinigai negrąžinami. Pas Pirkėją esantys rinkiniai visada turi tilpti į jo dabartinės prenumeratos „Briksių“ ribą: jei nuskaitymo dieną rinkiniai netelpa į mažesnio plano ribą, perėjimas atidedamas ir nuskaitoma dabartinio plano kaina, o mažesnis planas įsigalioja nuo kito nuskaitymo po to, kai rinkiniai grąžinami.'
  );

  v_after := replace(
    v_after,
    'Nutraukus prenumeratą, likę „Briksiai“ anuliuojami ir į pinigus nekeičiami.',
    '„Briksiai“ nėra kas mėnesį atsinaujinantis limitas: jie nustato, kiek rinkinių Pirkėjas gali turėti namie vienu metu, todėl nepanaudoti „Briksiai“ į kitą mėnesį nepersikelia. Nutraukus prenumeratą, likę „Briksiai“ anuliuojami ir į pinigus nekeičiami.'
  );

  v_after := replace(
    v_after,
    'Pasibaigus laikotarpiui, rinkinys turi būti grąžintas per 2 darbo dienas.',
    'Prenumerata baigiasi tik grąžinus visus rinkinius: kol rinkiniai negrąžinti, mokestis tęsiasi, o prašymas atšaukti įsigalioja, kai grąžinamas paskutinis rinkinys.'
  );

  if v_after = v_before then
    raise exception 'store_rules text did not match; nothing updated';
  end if;

  update public.legal_pages
  set sections = v_after::jsonb, updated_at = now()
  where slug = 'store_rules';
end
$$;
