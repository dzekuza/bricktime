-- Readable set URLs: /rinkinys/<slug> instead of /rinkinys/<id>.
-- The slug is stored (not derived from the title on every request) so a link
-- keeps working when a title is edited later.

-- Lithuanian (and common Latin) letters become plain ASCII, the ® and ™ signs
-- are dropped, everything else that is not a letter or digit becomes a dash.
create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from left(
    regexp_replace(
      lower(translate(
        replace(replace(value, '®', ''), '™', ''),
        'ąčęėįšųūžĄČĘĖĮŠŲŪŽáàâäéèêëíìîïóòôöúùûüñß',
        'aceeisuuzACEEISUUZaaaaeeeeiiiioooouuuuns'
      )),
      '[^a-z0-9]+', '-', 'g'
    ),
    120
  ))
$$;

alter table public.products add column if not exists slug text;

-- Backfill. A second set with the same title gets its id appended.
update public.products p
set slug = coalesce(nullif(public.slugify(p.title), ''), 'rinkinys') ||
  case when d.rn > 1 or public.slugify(p.title) = '' then '-' || p.id else '' end
from (
  select id, row_number() over (partition by public.slugify(title) order by id) as rn
  from public.products
) d
where d.id = p.id and p.slug is null;

alter table public.products alter column slug set not null;
create unique index if not exists products_slug_key on public.products (slug);

-- New sets get a slug from their title unless one is given. The title is not
-- watched afterwards: editing it must not break links already shared.
create or replace function public.set_product_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := coalesce(nullif(public.slugify(new.title), ''), 'rinkinys');
    if exists (select 1 from public.products where slug = new.slug) or new.slug = 'rinkinys' then
      new.slug := new.slug || '-' || new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_set_slug on public.products;
create trigger products_set_slug
  before insert on public.products
  for each row execute function public.set_product_slug();

-- NOTE: rollback is `drop trigger products_set_slug on public.products;
-- drop function public.set_product_slug(); alter table public.products drop column slug;
-- drop function public.slugify(text);`
