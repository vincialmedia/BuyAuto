-- Give a wizard draft a real link to the listing it spawned.
--
-- Until now the only thing tying a listing_drafts row to its listing was the
-- self-reported `data->>'id'` inside the draft's JSON blob. Nothing on the
-- create path ever writes that key: createOrUpdateListing INSERTs the listing
-- and hands the new id back to React state only. Four separate mechanisms all
-- keyed off that missing field and therefore all failed together --
--
--   1. deleteListingDraftsForListingId()      (client cleanup)
--   2. delete_listing_drafts_on_publish()     (this trigger)
--   3. the dashboard's self-heal sweep
--   4. the draft-completion-reminder's "already published, skip it" guard
--
-- so the draft survived the publish AND the reminder failed to skip it. Five
-- days later the seller was emailed that their already-live car was an
-- unfinished draft, with a link that re-ran the wizard and created a duplicate
-- listing. Three sellers hit this; one acted on it.
--
-- The column below is the durable link. The trigger is rewritten to use it,
-- keeping the legacy JSON key as a fallback and adding a VIN match so drafts
-- orphaned before this migration are cleaned up too.

alter table public.listing_drafts
  add column if not exists listing_id uuid
    references public.listings(id) on delete set null;

comment on column public.listing_drafts.listing_id is
  'The listing this draft spawned. Set when the wizard creates the listing; the delete trigger and the reminder''s skip guard key on it. Nullable: a draft that never reached step 5 has no listing.';

create index if not exists listing_drafts_listing_id_idx
  on public.listing_drafts (listing_id);

-- Backfill 1: rows where the legacy JSON key does point at a real listing.
update public.listing_drafts ld
set listing_id = l.id
from public.listings l
where ld.listing_id is null
  and coalesce(ld.data->>'id', '') <> ''
  and l.id::text = ld.data->>'id';

-- Backfill 2: the orphans the legacy key could never match -- same owner, same
-- VIN. This is the population that produced the false reminders.
update public.listing_drafts ld
set listing_id = l.id
from public.listings l
where ld.listing_id is null
  and coalesce(ld.data->>'vin', '') <> ''
  and l.vin = ld.data->>'vin'
  and l.user_id = ld.user_id;

create or replace function public.delete_listing_drafts_on_publish()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
begin
  -- 'pending' joins ('published','active'): a free listing goes draft -> pending
  -- and then waits for moderation, so it may sit for days without ever passing
  -- through 'published'. The draft is redundant the moment the listing row is
  -- submitted -- that row now holds the data -- and leaving it until publish is
  -- exactly the window the false reminders fired in.
  if new.status not in ('published'::listing_status,
                        'active'::listing_status,
                        'pending'::listing_status) then
    return new;
  end if;

  -- On UPDATE only act when the status actually moved, so ordinary content
  -- edits to a live listing don't re-run the delete on every save.
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  delete from public.listing_drafts ld
  where
    -- the durable link
    ld.listing_id = new.id
    -- legacy rows written before listing_id existed
    or coalesce(ld.data->>'id', '') = new.id::text
    -- neither link, but demonstrably the same car: same owner, same VIN
    or (
      ld.user_id = coalesce(new.user_id, new.created_by)
      and coalesce(ld.data->>'vin', '') <> ''
      and coalesce(new.vin, '') = ld.data->>'vin'
    );

  return new;
end;
$function$;
