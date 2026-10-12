-- New sets should land on the landing page unless an admin opts them out.
alter table public.products alter column featured set default true;

-- NOTE: rollback is `alter table public.products alter column featured set default false;`
