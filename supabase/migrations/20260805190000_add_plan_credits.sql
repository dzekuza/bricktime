-- Adds a real numeric credit allowance per plan ("Briksių kreditai"). Previously
-- this figure only existed as a display string inside plans.comparison_data,
-- with no column backing the actual rental-eligibility logic. Backfill from
-- that existing JSON string per plan; comparison_data keeps the key too (kept
-- in sync going forward by the admin write path), it is not removed here.

alter table public.plans add column credits integer not null default 0;

update public.plans set credits = 100 where id = 'nano';
update public.plans set credits = 200 where id = 'mini';
update public.plans set credits = 300 where id = 'standard';
update public.plans set credits = 400 where id = 'mega';
-- mystery_s / mystery_m keep the default 0 — sets are auto-assigned, not chosen against a budget.

-- Down migration (manual rollback):
-- alter table public.plans drop column credits;
