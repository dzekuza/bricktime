-- Allow authenticated subscribers to insert their own orders.
-- subscriber_id must match auth.uid() so users can't create orders for others.
create policy "orders_insert_own" on orders
  for insert with check ((select auth.uid()) = subscriber_id);
