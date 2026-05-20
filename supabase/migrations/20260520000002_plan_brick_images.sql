-- Set brick images for each plan matching the local SVG assets in public/bricks/
UPDATE plans SET brick_image = '/bricks/brick-yellow.svg'
WHERE name ILIKE '%mystery%' AND name ILIKE '%mėgėj%';

UPDATE plans SET brick_image = '/bricks/brick-green.svg'
WHERE name ILIKE 'mėgėjas';

UPDATE plans SET brick_image = '/bricks/brick-pink.svg'
WHERE name ILIKE '%mystery%' AND name ILIKE '%kūrėj%';

UPDATE plans SET brick_image = '/bricks/brick-orange.svg'
WHERE name ILIKE 'kūrėjas';

UPDATE plans SET brick_image = '/bricks/brick-blue.svg'
WHERE name ILIKE 'meistras';

UPDATE plans SET brick_image = '/bricks/brick-purple.svg'
WHERE name ILIKE 'legenda';
