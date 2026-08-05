-- The FAQ question list is reused across multiple pages (Home, Subscribe, the
-- standalone /help FAQ page), not just Home — rename the table to reflect that
-- it's site-wide content, not page-scoped like home_content/home_testimonials.

alter table public.home_faq_items rename to faq_items;
alter policy "home_faq_items_public_read" on public.faq_items rename to "faq_items_public_read";
alter policy "home_faq_items_admin_write" on public.faq_items rename to "faq_items_admin_write";

-- Down migration (manual rollback):
-- alter policy "faq_items_admin_write" on public.faq_items rename to "home_faq_items_admin_write";
-- alter policy "faq_items_public_read" on public.faq_items rename to "home_faq_items_public_read";
-- alter table public.faq_items rename to home_faq_items;
