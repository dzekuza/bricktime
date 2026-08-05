-- Replace the fixed 3-column heading pattern (line1 / highlighted word / line2)
-- with a single free-text column per heading using lightweight markup:
-- "==text==" marks a highlighted span, "\n" is a line break. This lets the
-- highlighted word be placed anywhere (start/middle/end of any line) instead
-- of being pinned to always sit on its own line between two fixed lines.
--
-- Old columns are kept (unused going forward) rather than dropped, since we
-- haven't confirmed nothing else depends on them yet.

alter table public.home_content add column hero_headline text not null default '';
alter table public.home_content add column how_it_works_heading text not null default '';
alter table public.home_content add column testimonials_heading text not null default '';
alter table public.home_content add column faq_cta_heading text not null default '';

update public.home_content set
  hero_headline = hero_headline_line1 || E'\n==' || hero_headline_highlight || E'==\n' || hero_headline_line3,
  how_it_works_heading = how_it_works_heading_line1 || E'\n==' || how_it_works_heading_highlight || E'==\n' || how_it_works_heading_line2,
  testimonials_heading = E'==' || testimonials_heading_highlight || E'==\n' || testimonials_heading_line2,
  faq_cta_heading = faq_cta_line || E'\n==' || faq_cta_highlight || E'=='
where id = 1;

-- Down migration (manual rollback):
-- alter table public.home_content drop column faq_cta_heading;
-- alter table public.home_content drop column testimonials_heading;
-- alter table public.home_content drop column how_it_works_heading;
-- alter table public.home_content drop column hero_headline;
