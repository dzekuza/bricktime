-- Update plan colors to match Figma design
UPDATE plans SET
  bg_color    = '#ffd731',
  text_color  = '#001b21',
  accent_color = '#001b21',
  cta_bg      = '#f5f1eb',
  cta_text    = '#001b21'
WHERE name ILIKE '%mystery%' AND name ILIKE '%mėgėj%';

UPDATE plans SET
  bg_color    = '#5ddb9c',
  text_color  = '#001b21',
  accent_color = '#001b21',
  cta_bg      = '#f5f1eb',
  cta_text    = '#001b21'
WHERE name ILIKE 'mėgėjas';

UPDATE plans SET
  bg_color    = '#ffaee7',
  text_color  = '#001b21',
  accent_color = '#001b21',
  cta_bg      = '#f5f1eb',
  cta_text    = '#001b21'
WHERE name ILIKE '%mystery%' AND name ILIKE '%kūrėj%';

UPDATE plans SET
  bg_color    = '#fb4903',
  text_color  = '#f5f1eb',
  accent_color = '#f5f1eb',
  cta_bg      = '#f5f1eb',
  cta_text    = '#001b21'
WHERE name ILIKE 'kūrėjas';

UPDATE plans SET
  bg_color    = '#4da2ff',
  text_color  = '#ffffff',
  accent_color = '#ffffff',
  cta_bg      = '#f5f1eb',
  cta_text    = '#001b21'
WHERE name ILIKE 'meistras';

UPDATE plans SET
  bg_color    = '#5c4ade',
  text_color  = '#ffffff',
  accent_color = '#ffffff',
  cta_bg      = '#f5f1eb',
  cta_text    = '#001b21'
WHERE name ILIKE 'legenda';
