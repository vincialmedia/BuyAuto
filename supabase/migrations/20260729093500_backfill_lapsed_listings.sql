-- ONE-TIME BACKFILL for listings that had already lapsed before expiry
-- enforcement (20260729093000) went live. Owner's decision: refresh them rather
-- than let them drop off — the featured/seeded listings are intentional.
--
--  * Published listings whose window had already elapsed: give them a fresh
--    window (now + their own duration, defaulting to 60 days) so the new expiry
--    sweep does not immediately archive them.
--  * Premium listings whose premium_until was already in the past: set it to NULL
--    = permanent, matching the platform owner's other seeded premium listings, so
--    the new premium sweep leaves them alone.
--
-- Runs as the migration role (auth.uid() IS NULL), so the status/premium/expiry
-- triggers admit these writes. Idempotent: re-running only touches rows that are
-- (still) lapsed, of which there will be none.

begin;

update public.listings
set expires_at = now() + make_interval(days => coalesce(duration_days, 60)),
    updated_at = now()
where status = 'published'::listing_status
  and expires_at is not null
  and expires_at <= now();

update public.listings
set premium_until = null,
    updated_at = now()
where premium = true
  and premium_until is not null
  and premium_until <= now();

commit;
