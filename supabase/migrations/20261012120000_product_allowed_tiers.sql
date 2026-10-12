-- Products were gated by a single `tier` meaning "this plan and every plan
-- above it". Admins now pick an explicit list of plans (incl. Mystery Box
-- S/M) that may rent a set. `tier` stays as the cheapest allowed plan, used
-- for the card colour and the checkout upsell.
alter table public.products
  add column allowed_tiers public.plan_tier[] not null default '{}';

-- Preserve current access: the old ladder was nano < mini < standard < mega
-- ('pro' is retired, mystery plans could not rent anything).
update public.products set allowed_tiers = case tier
  when 'nano' then array['nano', 'mini', 'standard', 'mega']::public.plan_tier[]
  when 'mini' then array['mini', 'standard', 'mega']::public.plan_tier[]
  when 'standard' then array['standard', 'mega']::public.plan_tier[]
  when 'pro' then array['mega']::public.plan_tier[]
  else array[tier]::public.plan_tier[]
end;

-- NOTE: rollback is `alter table public.products drop column allowed_tiers;`
