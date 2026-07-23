-- Corrections from client (korekcijos2): rebalance which perks show per plan.
-- Targeted UPDATE per plan id (not a full-row upsert) so this never touches
-- name/cta_label/tagline/price columns that may already be hand-edited via
-- the admin Plans page.
--
-- Rules applied:
--   - Drop the leading "set size" bullet from every plan (e.g. "1 S dydžio
--     rinkinys per mėnesį") — redundant with the comparison table.
--   - "Nemokamas pristatymas kurjeriu": keep only on mega (Legenda).
--   - "Ankstyva prieiga prie naujų rinkinių": keep only on standard (Meistras)
--     and mega (Legenda).
--   - "Pats renkiesi rinkinį": remove from mystery_s/mystery_m (they don't
--     choose their own set); add to nano/mini/standard/mega (they do).

UPDATE plans SET perks =
  '[{"label":"Iki 800 kaladėlių","included":true},{"label":"Rinkinys parenkamas automatiškai","included":true},{"label":"Fizinė instrukcija","included":true},{"label":"Nemokamas pristatymas paštomatu","included":true}]'::jsonb
WHERE id = 'mystery_s';

UPDATE plans SET perks =
  '[{"label":"Iki 800 kaladėlių","included":true},{"label":"100 Briksių kreditų","included":true},{"label":"Fizinė instrukcija","included":true},{"label":"Nemokamas pristatymas paštomatu","included":true},{"label":"Pats renkiesi rinkinį","included":true}]'::jsonb
WHERE id = 'nano';

UPDATE plans SET perks =
  '[{"label":"Iki 2 000 kaladėlių","included":true},{"label":"Rinkinys parenkamas automatiškai","included":true},{"label":"Fizinė instrukcija","included":true},{"label":"Nemokamas pristatymas paštomatu","included":true}]'::jsonb
WHERE id = 'mystery_m';

UPDATE plans SET perks =
  '[{"label":"Iki 2 000 kaladėlių","included":true},{"label":"200 Briksių kreditų","included":true},{"label":"Fizinė instrukcija","included":true},{"label":"Nemokamas pristatymas paštomatu","included":true},{"label":"Pats renkiesi rinkinį","included":true}]'::jsonb
WHERE id = 'mini';

UPDATE plans SET perks =
  '[{"label":"Iki 4 400 kaladėlių","included":true},{"label":"300 Briksių kreditų","included":true},{"label":"Fizinė instrukcija","included":true},{"label":"Ankstyva prieiga prie naujų rinkinių","included":true},{"label":"Nemokamas pristatymas paštomatu","included":true},{"label":"Pats renkiesi rinkinį","included":true}]'::jsonb
WHERE id = 'standard';

UPDATE plans SET perks =
  '[{"label":"Iki 11 000 kaladėlių","included":true},{"label":"400 Briksių kreditų","included":true},{"label":"Fizinė instrukcija","included":true},{"label":"Ankstyva prieiga prie naujų rinkinių","included":true},{"label":"Nemokamas pristatymas kurjeriu","included":true},{"label":"Pats renkiesi rinkinį","included":true}]'::jsonb
WHERE id = 'mega';
