-- Declined listings get the same 30-day limit a draft gets.
--
-- A declined listing previously sat forever: it is not a draft, so the archive
-- sweep never saw it, and it carried no deletion deadline. Drafts age out after
-- 30 days; a decline is the same kind of dead weight and now gets the same
-- clock.
--
-- Shape of the clock:
--   * The deadline is 30 days from the decline (archived_at, or updated_at for
--     the older 'rejected' rows that never got an archived_at stamp).
--   * sweep_expire_declined_listings writes draft_delete_at only in the final
--     5 days, so the dashboard's derived countdown and the stored deadline name
--     the SAME date — the countdown runs 30 -> 0 without a jump — while the
--     first 25 days leave draft_delete_at NULL so that reverting to draft
--     hands back a clean 30-day draft, not a partly-spent deletion deadline.
--   * Anything already past 30 days when this ships (every existing decline is)
--     gets a 5-day floor, so no listing disappears without a visible warning.
--
-- Money: the blanket "never delete a paid listing" guard is wrong for declines.
-- Every existing declined listing reads payment_status='paid' purely because a
-- CHF 0 free listing is recorded that way (price_paid_chf = 0, no
-- PaymentIntent) — that guard would freeze them forever. A decline is refunded
-- (adminService refunds before sending the rejection email), so 'paid' is only
-- a real claim when actual money was taken and no refund was recorded.
--
-- CREATE OR REPLACE FUNCTION swaps the whole body, so the rewritten functions
-- below restate every guard they already had: the garage-inventory exclusion
-- (a lapsed dealer's parked inventory must stay recoverable), the
-- requires_payment 2-day grace, and the EvalPlanQual re-check on DELETE.

-- The 'rejected' decline path never stamped archived_at (update-status only set
-- it for status='archived'), so give those rows a decline timestamp to count
-- from. updated_at is the moment the status flipped, and a rejected listing is
-- not owner-editable, so it has not drifted since.
update public.listings
set archived_at = updated_at
where status = 'rejected'::listing_status
  and archived_at is null;

create or replace function public.sweep_expire_declined_listings()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_count integer := 0;
begin
  update public.listings
  set draft_delete_at = greatest(
        coalesce(archived_at, updated_at) + interval '30 days',
        -- Never delete without a visible countdown: a decline that is already
        -- past its 30 days (every pre-existing one) still gets 5 days.
        now() + interval '5 days'
      )
  where draft_delete_at is null
    -- Only admin declines. An owner's own archive (archived_reason IS NULL) is
    -- never touched, and 'draft_expired' has its own sweep.
    and (
      status = 'rejected'::listing_status
      or (status = 'archived'::listing_status and archived_reason = 'moderation_declined')
    )
    -- Stamped 5 days before it fires, so the stored deadline agrees with the
    -- dashboard's derived 30-day countdown instead of restarting it.
    and coalesce(archived_at, updated_at) <= now() - interval '25 days'
    -- A lapsed dealer's parked inventory must stay recoverable.
    and garage_id is null
    -- Real money that was never refunded: the listing is the seller's record of
    -- the charge, so it stays.
    and (coalesce(price_paid_chf, 0) = 0 or stripe_refund_id is not null);

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

comment on function public.sweep_expire_declined_listings() is
  'Stamps draft_delete_at on admin-declined listings (status rejected, or archived with archived_reason=''moderation_declined'') 30 days after the decline, so sweep_delete_archived_drafts removes them. Skips garage inventory and any decline where real money was taken and not refunded. Owner self-archives (archived_reason IS NULL) are never touched.';

create or replace function public.sweep_delete_archived_drafts()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_wizard integer := 0;
  v_listings integer := 0;
begin
  with doomed as (
    select *
    from public.listings
    where draft_delete_at is not null
      and draft_delete_at <= now()
      -- 'rejected' joins the list: a declined listing now carries a deadline.
      and status in ('archived'::listing_status, 'draft'::listing_status, 'rejected'::listing_status)
      and garage_id is null
      and (
        coalesce(payment_status::text, '') <> 'paid'
        -- A decline is refunded (or was a CHF 0 free listing recorded as
        -- 'paid'), so 'paid' alone is not a claim on it. Drafts keep the
        -- blanket guard: those are listings the seller still owns.
        or (
          (status = 'rejected'::listing_status or archived_reason = 'moderation_declined')
          and (coalesce(price_paid_chf, 0) = 0 or stripe_refund_id is not null)
        )
      )
      and (coalesce(payment_status::text, '') <> 'requires_payment'
           or draft_delete_at <= now() - interval '2 days')
  ), tombstoned as (
    insert into public.listing_tombstones (
      original_listing_id, garage_id, seller_user_id, brand, model, year,
      location, deal_type, financing_type, price_per_month_chf,
      purchase_price_chf, cover_image_url, sold_at, deleted_at
    )
    select
      d.id, d.garage_id, d.created_by, d.brand, d.model, d.year,
      d.location, d.deal_type, d.financing_type, d.price_per_month_chf,
      d.purchase_price_chf, d.cover_image_url, null, now()
    from doomed d
    on conflict (original_listing_id) do nothing
    returning original_listing_id
  ), removed as (
    delete from public.listings l
    using doomed d
    where l.id = d.id
      -- Re-checked on the current row version: a concurrent publish/payment
      -- between snapshot and lock keeps the row alive.
      and l.status in ('archived'::listing_status, 'draft'::listing_status, 'rejected'::listing_status)
      and l.garage_id is null
      and l.draft_delete_at is not null
      and l.draft_delete_at <= now()
      and (
        coalesce(l.payment_status::text, '') <> 'paid'
        or (
          (l.status = 'rejected'::listing_status or l.archived_reason = 'moderation_declined')
          and (coalesce(l.price_paid_chf, 0) = 0 or l.stripe_refund_id is not null)
        )
      )
      and (coalesce(l.payment_status::text, '') <> 'requires_payment'
           or l.draft_delete_at <= now() - interval '2 days')
    returning l.id
  )
  select count(*) into v_listings from removed;

  delete from public.listing_drafts
  where archived_at is not null
    and archived_at <= now() - interval '5 days';
  get diagnostics v_wizard = row_count;

  return jsonb_build_object(
    'wizard_drafts_deleted', v_wizard,
    'draft_listings_deleted', v_listings
  );
end;
$function$;

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

  -- Same error for "does not exist" and "not yours": no existence oracle.
  if not found
     or auth.uid() is null
     or (v_listing.created_by is distinct from auth.uid() and v_listing.user_id is distinct from auth.uid()) then
    raise exception 'listing_not_found';
  end if;

  -- Aged-out drafts, admin-declined listings and archived listings can all be
  -- pulled back to draft. Live states have their own transitions.
  if v_listing.status not in ('archived'::listing_status, 'rejected'::listing_status) then
    raise exception 'only_archived_or_rejected_can_be_reverted';
  end if;

  if v_listing.draft_delete_at is not null and v_listing.draft_delete_at <= now() then
    raise exception 'deletion_deadline_passed';
  end if;

  update public.listings
  set status = 'draft'::listing_status,
      -- The deadline survives the revive, but never so close that the next
      -- hourly sweep deletes the draft mid-edit. A decline reverted before its
      -- final 5 days has no deadline at all, so it becomes an ordinary draft
      -- with a fresh 30-day clock.
      draft_delete_at = case
        when draft_delete_at is null then null
        else greatest(draft_delete_at, now() + interval '24 hours')
      end,
      -- It is a draft now, not an archived or declined listing. Leaving these
      -- set made the admin Entwürfe view read the stale stamp as "already
      -- archived" and show a deletion countdown for a live draft, and left a
      -- 'moderation_declined' marker that would exempt the row from the delete
      -- sweep's payment guard.
      archived_at = null,
      archived_reason = null,
      -- Restarts the 30-day idle clock from the revert.
      updated_at = now()
  where id = p_listing_id;
end;
$function$;

create or replace function public.run_listing_maintenance()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_reactivated integer;
  v_expired integer;
  v_premium integer;
  v_drafts_archived jsonb;
  v_declined integer;
  v_drafts_deleted jsonb;
begin
  v_reactivated := public.sweep_reactivate_paused();
  v_expired := public.sweep_expired_listings();
  v_premium := public.sweep_lapsed_premium();
  v_drafts_archived := public.sweep_archive_stale_drafts();
  -- Before the delete sweep so a newly stamped deadline is visible to it, but
  -- the stamp is always >= 5 days out, so nothing is stamped and deleted in the
  -- same run.
  v_declined := public.sweep_expire_declined_listings();
  v_drafts_deleted := public.sweep_delete_archived_drafts();

  return jsonb_build_object(
    'reactivated', v_reactivated,
    'expired', v_expired,
    'premium_cleared', v_premium,
    'drafts_archived', v_drafts_archived,
    'declined_stamped', v_declined,
    'drafts_deleted', v_drafts_deleted
  );
end;
$function$;
