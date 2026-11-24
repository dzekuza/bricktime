-- Readable merch URLs: /merch/brick-time-dzemperis-su-gobtuvu-geltonas instead
-- of /merch/bricktime-hoodie. The slug now follows the product name (same
-- slugify as sets). The previous slugs are kept in legacy_slugs so old links
-- (shared URLs, Stripe return links) still reach the product and are
-- redirected to the new address.
alter table public.merch_items
  add column if not exists legacy_slugs text[] not null default '{}';

update public.merch_items m
set legacy_slugs = array_append(m.legacy_slugs, m.slug),
    slug = public.slugify(m.name)
where public.slugify(m.name) <> ''
  and m.slug <> public.slugify(m.name)
  and not exists (
    select 1 from public.merch_items o
    where o.slug = public.slugify(m.name) and o.id <> m.id
  );

-- NOTE: rollback is `update public.merch_items set slug = legacy_slugs[1]
-- where cardinality(legacy_slugs) > 0; alter table public.merch_items
-- drop column legacy_slugs;`
