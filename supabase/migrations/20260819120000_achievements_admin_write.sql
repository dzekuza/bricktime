-- Allow the admin dashboard to manage the achievement/reward catalog (labels, points,
-- icons), matching the existing app_metadata role pattern used on coupons/gift_cards/etc.
create policy achievements_admin_write on public.achievements for all
  using ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));
