-- Distinguish a moderation decline from a plain admin archive.
--
-- The moderation queue's decline action parks a listing in 'archived' and
-- sends the rejection email, while the all-listings view's decline sets
-- 'rejected'. Both are the same outcome for the seller, but only the second
-- one showed "Abgelehnt" on the dashboard — the first was indistinguishable
-- from an ordinary archive.
--
-- Backfill: an archived listing that carries a moderation note was taken down
-- by an admin with a stated reason, i.e. a decline. (Owner self-archives go
-- through archive_listing, which never writes a note.) 'draft_expired' rows
-- are excluded — that marker drives automatic deletion and must not be
-- overwritten.

update public.listings
set archived_reason = 'moderation_declined'
where status = 'archived'
  and moderation_note is not null
  and btrim(moderation_note) <> ''
  and archived_reason is null;

comment on column public.listings.archived_reason is
  'Why the listing was archived. ''draft_expired'' marks a draft that went stale and is eligible for deletion 5 days after archived_at; ''moderation_declined'' marks an admin decline (shown as "Abgelehnt" to the seller); NULL archives are never auto-deleted.';
