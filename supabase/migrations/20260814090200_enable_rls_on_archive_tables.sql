-- The July 2 archive snapshots were created with RLS disabled while the broad
-- table grants carried over, so any anon/authenticated client could read the
-- full archived listing and draft rows (including contact details) straight
-- through PostgREST. Enable RLS with no policies — only the service role
-- (which bypasses RLS) works with these snapshots — and drop the direct
-- grants as belt and braces.

alter table public.listings_archive_20260702 enable row level security;
alter table public.listing_drafts_archive_20260702 enable row level security;

revoke all on table public.listings_archive_20260702 from anon, authenticated;
revoke all on table public.listing_drafts_archive_20260702 from anon, authenticated;
