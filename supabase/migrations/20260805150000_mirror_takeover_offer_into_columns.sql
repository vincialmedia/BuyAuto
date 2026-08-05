-- Mirror the lease-takeover add-on offer into the flat pricing columns.
--
-- The public site presents a direct-purchase listing with an enabled
-- leasing_offer->lease_takeover_offer as a Leasingübernahme and reads the
-- monthly rate, remaining months, deposit and remaining km from that JSON.
-- The flat columns on those rows held wizard leftovers instead (typically
-- remaining_months = 12, deposit_chf = 0, price_per_month_chf = NULL), so
-- every column reader — admin panel, search filters, tombstones, emails —
-- contradicted what buyers saw. The write path now keeps the columns in sync
-- (createListingService mirrors on every save); this backfill repairs the
-- existing rows the same way.
--
-- Casts go through numeric + round() because the JSON consistency check
-- allows decimal strings while the columns are integers. updated_at is left
-- untouched on purpose: it is the idle clock for the draft sweeps, and this
-- is a metadata repair, not seller activity. lease_takeover rows are never
-- touched — there the columns are the seller-entered source of truth. Draft
-- rows are deliberately included: the write path mirrors them on their next
-- save anyway, and nothing here advances the draft idle clock (no trigger
-- stamps updated_at on listings).

-- Rows with an enabled takeover offer: columns take the offer's values. The
-- IS DISTINCT FROM guard makes re-runs true no-ops — without it every synced
-- row would be rewritten again (new tuple versions, all unrestricted row
-- triggers firing) despite nothing changing.
UPDATE public.listings
SET price_per_month_chf = round((leasing_offer -> 'lease_takeover_offer' ->> 'price_per_month_chf')::numeric)::int,
    remaining_months    = round((leasing_offer -> 'lease_takeover_offer' ->> 'remaining_months')::numeric)::int,
    deposit_chf         = round((leasing_offer -> 'lease_takeover_offer' ->> 'deposit_chf')::numeric)::int,
    remaining_km        = CASE
                            WHEN (leasing_offer -> 'lease_takeover_offer' ->> 'remaining_km') IS NOT NULL
                            THEN round((leasing_offer -> 'lease_takeover_offer' ->> 'remaining_km')::numeric)::int
                            ELSE NULL
                          END
WHERE deal_type = 'direct_purchase'
  AND COALESCE(leasing_offer -> 'lease_takeover_offer' ->> 'enabled', 'false') = 'true'
  AND (price_per_month_chf IS DISTINCT FROM round((leasing_offer -> 'lease_takeover_offer' ->> 'price_per_month_chf')::numeric)::int
       OR remaining_months IS DISTINCT FROM round((leasing_offer -> 'lease_takeover_offer' ->> 'remaining_months')::numeric)::int
       OR deposit_chf IS DISTINCT FROM round((leasing_offer -> 'lease_takeover_offer' ->> 'deposit_chf')::numeric)::int
       OR remaining_km IS DISTINCT FROM CASE
                                          WHEN (leasing_offer -> 'lease_takeover_offer' ->> 'remaining_km') IS NOT NULL
                                          THEN round((leasing_offer -> 'lease_takeover_offer' ->> 'remaining_km')::numeric)::int
                                          ELSE NULL
                                        END);

-- Plain direct-purchase rows: clear the stale wizard defaults.
UPDATE public.listings
SET price_per_month_chf = NULL,
    remaining_months    = NULL,
    deposit_chf         = NULL,
    remaining_km        = NULL
WHERE deal_type = 'direct_purchase'
  AND COALESCE(leasing_offer -> 'lease_takeover_offer' ->> 'enabled', 'false') <> 'true'
  AND (price_per_month_chf IS NOT NULL
       OR remaining_months IS NOT NULL
       OR deposit_chf IS NOT NULL
       OR remaining_km IS NOT NULL);
