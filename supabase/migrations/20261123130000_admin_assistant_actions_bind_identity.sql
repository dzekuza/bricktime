-- Tighten the audit-log insert policy: the email must be the signer's own and
-- the timestamp can't be backdated. (The row still comes from the browser,
-- so it is a best-effort trail of admin-confirmed changes, not tamper-proof.)
drop policy if exists admin_assistant_actions_admin_insert on public.admin_assistant_actions;

create policy admin_assistant_actions_admin_insert
  on public.admin_assistant_actions
  for insert to authenticated
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and admin_id = (select auth.uid())
    and admin_email is not distinct from ((select auth.jwt()) ->> 'email')
    and created_at >= now() - interval '1 minute'
  );
