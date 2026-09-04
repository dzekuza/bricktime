-- Catalogue rows still carried categories from the admin's old hardcoded
-- English list, which matched no option in the storefront's SERIES filter, so
-- those sets disappeared whenever a theme filter was active.
update public.products set category = 'City'
where category in ('Miestas', 'Cityscape');

update public.products set category = 'Kita'
where category in ('Transportas', 'Vehicles', 'Gamta', 'Sci-fi');
