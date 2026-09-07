-- Rewrites hardcoded Storage URLs that embed the OLD project ref.
-- Run against the TARGET, after the data restore.
--
-- The project ref is part of every Storage URL, so rows carrying a full URL
-- keep pointing at the old (now restricted) project until rewritten.
--
-- Affected on source at migration time:
--   products.image_url   4 rows
--   products.gallery     3 rows  (jsonb)
--   feed_items.image_url 2 rows
--
--   psql "$TARGET_DB_URL" -X -f 06-rewrite-storage-urls.sql

\set old_ref 'ohofugyndkaalzsyobvb'
\set new_ref 'yzqaiqgzvlmxnehtqazq'

begin;

-- Show what will change before changing it.
select 'BEFORE' as phase, 'products.image_url' as loc, count(*) as rows
from products where image_url like '%' || :'old_ref' || '%'
union all
select 'BEFORE', 'products.gallery', count(*)
from products where gallery::text like '%' || :'old_ref' || '%'
union all
select 'BEFORE', 'feed_items.image_url', count(*)
from feed_items where image_url like '%' || :'old_ref' || '%';

update products
   set image_url = replace(image_url, :'old_ref', :'new_ref')
 where image_url like '%' || :'old_ref' || '%';

update products
   set gallery = replace(gallery::text, :'old_ref', :'new_ref')::jsonb
 where gallery::text like '%' || :'old_ref' || '%';

update feed_items
   set image_url = replace(image_url, :'old_ref', :'new_ref')
 where image_url like '%' || :'old_ref' || '%';

-- Must all be 0.
select 'AFTER' as phase, 'products.image_url' as loc, count(*) as remaining
from products where image_url like '%' || :'old_ref' || '%'
union all
select 'AFTER', 'products.gallery', count(*)
from products where gallery::text like '%' || :'old_ref' || '%'
union all
select 'AFTER', 'feed_items.image_url', count(*)
from feed_items where image_url like '%' || :'old_ref' || '%';

-- Sweep every remaining text/jsonb column in case new URLs were added since
-- this script was written. Any row here needs a manual UPDATE above.
select table_name,
  (xpath('/row/cnt/text()', query_to_xml(
     format('select count(*) as cnt from public.%I where to_jsonb(%I)::text like ''%%' || :'old_ref' || '%%''',
            table_name, table_name), false, true, '')))[1]::text::int as still_referencing_old
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by still_referencing_old desc, table_name;

-- Review the output above, then COMMIT (or ROLLBACK if anything looks wrong).
commit;
