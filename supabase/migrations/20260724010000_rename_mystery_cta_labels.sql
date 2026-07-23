-- Follow-up to 20260724000000_update_plan_perks.sql: the Mystery Box "S"/"M"
-- naming was supposed to be eliminated everywhere (per client corrections),
-- but the plan card CTA button labels were still "Pradėti su Mystery S" /
-- "Pradėti su Mystery M". Rename to match the actual plan names
-- ("Mystery Box Mėgėjams" / "Mystery Box Kūrėjams").

UPDATE plans SET cta_label = 'Pradėti su Mystery Box Mėgėjams'
WHERE id = 'mystery_s';

UPDATE plans SET cta_label = 'Pradėti su Mystery Box Kūrėjams'
WHERE id = 'mystery_m';
