-- Readable merch URLs: /merch/brick-time-dzemperis-su-gobtuvu-geltonas instead
-- of /merch/bricktime-hoodie. The slug now follows the product name (same
-- slugify as sets). The previous slugs are kept in legacy_slugs so old links
-- (shared URLs, Stripe return links) still reach the product and are
-- redirected to the new address.
alter table public.merch_items
  add column if not exists legacy_slugs text[] not null default '{}';

-- Row by row so each check sees the renames already made; an item whose new
-- slug is taken keeps its old one.
do $$
declare
  r record;
  wanted text;
begin
  for r in select id, name, slug from public.merch_items order by id loop
    wanted := public.slugify(r.name);
    if wanted <> '' and wanted <> r.slug
       and not exists (
         select 1 from public.merch_items o
         where o.slug = wanted and o.id <> r.id
       ) then
      update public.merch_items
      set legacy_slugs = array_append(legacy_slugs, r.slug), slug = wanted
      where id = r.id;
    end if;
  end loop;
end $$;

-- A live slug must never equal another item's old slug, or the old link would
-- open the wrong product (current slugs are looked up first).
create or replace function public.merch_slug_not_legacy()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.merch_items o
    where o.id <> new.id and new.slug = any (o.legacy_slugs)
  ) then
    raise exception 'slug % is an old address of another merch item', new.slug;
  end if;
  return new;
end $$;

drop trigger if exists merch_slug_not_legacy on public.merch_items;
create trigger merch_slug_not_legacy
  before insert or update of slug on public.merch_items
  for each row execute function public.merch_slug_not_legacy();

-- NOTE: rollback is `update public.merch_items set slug = legacy_slugs[1]
-- where cardinality(legacy_slugs) > 0; alter table public.merch_items
-- drop column legacy_slugs;` (and drop the merch_slug_not_legacy trigger first)
