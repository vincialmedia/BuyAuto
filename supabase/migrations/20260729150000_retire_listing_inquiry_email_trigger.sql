-- Retire the listing-inquiry email trigger + function.
--
-- The listing-inquiry UI (InquiryForm / StickyListingCta) was unreachable dead
-- code and has been removed; nothing inserts into public.listing_inquiries
-- anymore, so the AFTER INSERT trigger that emailed the seller
-- (on_inquiry_created -> handle_new_inquiry -> send-inquiry-email edge function)
-- is dormant. Drop the trigger and its function.
--
-- The listing_inquiries TABLE is intentionally KEPT: it still holds historical
-- inquiry rows and is read for the dashboard "Anfragen" stat
-- (dashboardService.getListingInquiryCounts) and cleaned up on dealer deletion
-- (admin/delete-dealer). Only the email-on-insert automation is retired.
--
-- Note: this only affects the database. The deployed `send-inquiry-email` edge
-- function (removed from the repo alongside this migration) can be deleted from
-- the Supabase project separately; leaving it deployed is harmless once this
-- trigger no longer calls it.

drop trigger if exists on_inquiry_created on public.listing_inquiries;
drop function if exists public.handle_new_inquiry();
