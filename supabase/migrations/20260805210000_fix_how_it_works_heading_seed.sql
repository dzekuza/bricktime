-- Fix a formatting bug in the previous migration's seed: "Pradėk" and
-- "konstruoti" render on the same line (separated by a space), not on
-- separate lines like the other headings.

update public.home_content
set how_it_works_heading = how_it_works_heading_line1 || E'\n==' || how_it_works_heading_highlight || E'== ' || how_it_works_heading_line2
where id = 1;
