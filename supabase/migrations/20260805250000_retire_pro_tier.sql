-- The 20260518000001 plan-catalog rewrite replaced pro/nano/mini/standard/mega
-- with mystery_s/nano/mystery_m/mini/standard/mega and never carried a 'pro'
-- row forward, orphaning any product or subscriber still tagged 'pro' (their
-- checkout calls 404 against `plans` with "Unknown plan: pro").
--
-- Products keep their historical tier value (plan_tier has no concept of
-- "unassigned"), but flipping status to sold_out pulls them out of the
-- purchasable/upgradeable catalog the same way any other out-of-stock set is.
update products set status = 'sold_out' where tier = 'pro';

-- Subscribers are billed on a real plan, so they move to the closest-priced
-- live plan (mini, €34.99) rather than being left on a value that no longer
-- resolves to anything.
update subscribers set plan = 'mini' where plan = 'pro';
