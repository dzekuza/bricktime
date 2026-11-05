-- claim_coupon_hold counts and prunes holds per coupon code.
-- Rollback: drop index if exists public.coupon_holds_code_idx;
create index if not exists coupon_holds_code_idx on public.coupon_holds (coupon_code, held_until);
