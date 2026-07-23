-- Follow-up to 20260724010000: shorten the Mystery Box CTA labels to "MB"
-- and match the dative-case convention used by every other plan's
-- cta_label ("Pradėti su Mėgėju", "Pradėti su Kūrėju", "Pradėti su Meistru").

UPDATE plans SET cta_label = 'Pradėti su MB Mėgėju'
WHERE id = 'mystery_s';

UPDATE plans SET cta_label = 'Pradėti su MB Kūrėju'
WHERE id = 'mystery_m';
