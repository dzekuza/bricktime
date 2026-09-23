-- Cover unindexed foreign keys flagged by the performance advisor and drop the
-- duplicate user_achievements(achievement_id) index.
-- Rollback: drop the six idx_* indexes below and re-create
-- idx_user_achievements_achievement_id on user_achievements (achievement_id).

create index if not exists idx_gift_cards_redeemed_by_user_id on public.gift_cards (redeemed_by_user_id);
create index if not exists idx_missing_part_requests_order_id on public.missing_part_requests (order_id);
create index if not exists idx_missing_part_requests_product_id on public.missing_part_requests (product_id);
create index if not exists idx_product_reviews_subscriber_id on public.product_reviews (subscriber_id);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_reports_reporter_id on public.reports (reporter_id);

drop index if exists public.idx_user_achievements_achievement_id;
