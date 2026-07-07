-- Grant the dashboard admin full access to the remaining tables, matching the
-- existing app_metadata role pattern already used on orders/plans/products/
-- subscribers. The admin signs in as a normal user whose JWT carries
-- app_metadata.role='admin'; RLS — not a browser service-role key — is what
-- authorizes writes. Permissive (additive) policies, so existing anon/owner
-- policies are untouched.

do $$
declare
  t text;
begin
  foreach t in array array['coupons', 'gift_cards', 'missing_part_requests', 'subscriber_penalties']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format(
      $f$create policy %I on public.%I for all
         using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
         with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))$f$,
      t || '_admin_write', t
    );
  end loop;
end $$;
