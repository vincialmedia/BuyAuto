-- "Auf Entwurf ändern": lets an owner pull an aged-out archived draft back to
-- 'draft' so it can be finished during the remaining deletion window. Guarded
-- RPC (same pattern as archive_listing / pause_listing) so the button can only
-- ever touch draft-expired archives — not manually archived or moderated
-- listings. The deletion deadline (draft_delete_at) is intentionally NOT
-- cleared: only publishing stops that clock.

create or replace function public.revert_listing_to_draft(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_listing public.listings%rowtype;
begin
  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  if auth.uid() is null or (v_listing.created_by is distinct from auth.uid() and v_listing.user_id is distinct from auth.uid()) then
    raise exception 'not_authorized';
  end if;

  if v_listing.status <> 'archived'::listing_status or v_listing.archived_reason is distinct from 'draft_expired' then
    raise exception 'only_expired_draft_archives_can_be_reverted';
  end if;

  update public.listings
  set status = 'draft'::listing_status,
      updated_at = now()
  where id = p_listing_id;
end;
$function$;

revoke all on function public.revert_listing_to_draft(uuid) from public, anon;
grant execute on function public.revert_listing_to_draft(uuid) to authenticated;
