-- Corrections from client (korekcijos2): remove the "Rinkiniai per mėnesį"
-- row from the plan comparison table and replace it with a row showing the
-- Briksių-value range each plan's monthly credit allowance unlocks
-- (derived from the existing "Briksių kreditai" figure per plan — Mystery
-- Box plans have no credits, since the set is auto-assigned, not chosen).

UPDATE plans SET comparison_data =
  '{"Pristatymas":"Paštomatas","Ankstyva prieiga":"—","Briksių kreditai":"—","Maks. kaladėlių":"800","Fizinė instrukcija":"✓","Grąžinimo terminas":"Neribotas","Briksių vertės diapazonas":"—","Rinkinį renkiesi pats":"—"}'::jsonb
WHERE id = 'mystery_s';

UPDATE plans SET comparison_data =
  '{"Pristatymas":"Paštomatas","Ankstyva prieiga":"—","Briksių kreditai":"100","Maks. kaladėlių":"800","Fizinė instrukcija":"✓","Grąžinimo terminas":"Neribotas","Briksių vertės diapazonas":"iki 100","Rinkinį renkiesi pats":"✓"}'::jsonb
WHERE id = 'nano';

UPDATE plans SET comparison_data =
  '{"Pristatymas":"Paštomatas","Ankstyva prieiga":"—","Briksių kreditai":"—","Maks. kaladėlių":"2 000","Fizinė instrukcija":"✓","Grąžinimo terminas":"Neribotas","Briksių vertės diapazonas":"—","Rinkinį renkiesi pats":"—"}'::jsonb
WHERE id = 'mystery_m';

UPDATE plans SET comparison_data =
  '{"Pristatymas":"Paštomatas","Ankstyva prieiga":"—","Briksių kreditai":"200","Maks. kaladėlių":"2 000","Fizinė instrukcija":"✓","Grąžinimo terminas":"Neribotas","Briksių vertės diapazonas":"iki 200","Rinkinį renkiesi pats":"✓"}'::jsonb
WHERE id = 'mini';

UPDATE plans SET comparison_data =
  '{"Pristatymas":"Paštomatas","Ankstyva prieiga":"✓","Briksių kreditai":"300","Maks. kaladėlių":"4 400","Fizinė instrukcija":"✓","Grąžinimo terminas":"Neribotas","Briksių vertės diapazonas":"iki 300","Rinkinį renkiesi pats":"✓"}'::jsonb
WHERE id = 'standard';

UPDATE plans SET comparison_data =
  '{"Pristatymas":"Kurjeris","Ankstyva prieiga":"✓","Briksių kreditai":"400","Maks. kaladėlių":"11 000","Fizinė instrukcija":"✓","Grąžinimo terminas":"Neribotas","Briksių vertės diapazonas":"iki 400","Rinkinį renkiesi pats":"✓"}'::jsonb
WHERE id = 'mega';
