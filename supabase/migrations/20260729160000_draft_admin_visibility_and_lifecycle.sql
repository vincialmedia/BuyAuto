-- Drafts: admin visibility + 30/5 day lifecycle
--
-- 1. Admins can read every user's wizard draft (listing_drafts). Owners keep
--    their existing own-row policies; nothing else on the site gains access.
-- 2. Drafts idle for 30 days become "Archiviert", and draft-originated
--    archives are hard-deleted 5 days after that.
--
-- Only draft-originated archives are ever deleted. A published listing that
-- expired into 'archived' keeps today's behaviour (kept indefinitely), which
-- is why listings.archived_reason exists to tell the two apart.

-- ---------------------------------------------------------------------------
-- 1. Admin read access on wizard drafts
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can view all listing drafts" on public.listing_drafts;

create policy "Admins can view all listing drafts"
  on public.listing_drafts
  for select
  using (public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 2. Lifecycle columns
-- ---------------------------------------------------------------------------

alter table public.listing_drafts
  add column if not exists archived_at timestamptz;

comment on column public.listing_drafts.archived_at is
  'Set when the draft went stale (30 days without an edit). The row is hard-deleted 5 days later.';

alter table public.listings
  add column if not exists archived_reason text;

comment on column public.listings.archived_reason is
  'Why the listing was archived. ''draft_expired'' marks a draft that went stale and is eligible for deletion 5 days after archived_at; NULL archives (e.g. an expired published listing) are never auto-deleted.';

create index if not exists listing_drafts_archived_at_idx
  on public.listing_drafts (archived_at)
  where archived_at is not null;

create index if not exists listing_drafts_updated_at_idx
  on public.listing_drafts (updated_at)
  where archived_at is null;

create index if not exists listings_archived_reason_idx
  on public.listings (archived_reason, archived_at)
  where archived_reason is not null;
