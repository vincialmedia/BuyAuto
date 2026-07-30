-- SECURITY FIX: listing premium status was self-grantable, for free.
--
-- The create-listing wizard wrote listings.premium straight from the browser
-- (Step3_PlanSelection -> createOrUpdateListing), and the owner_update RLS policy
-- lets a listing owner update ANY column on a row they own. So a private seller
-- could set premium = true -- through the wizard's "Premium Boost" toggle, or with
-- a raw PostgREST PATCH -- without ever paying the CHF 30. searchListings filters
-- on `premium` alone and the wizard never wrote premium_until, so the result was
-- permanent homepage placement for free.
--
-- A column-level REVOKE cannot express this: admins reach the table through the
-- same `authenticated` role as sellers, so a grant-level block would also kill the
-- backend Premium toggle. A BEFORE trigger can, because it sees who the caller is.
-- Premium changes are rejected unless the caller is one of the three legitimate
-- grantors:
--
--   1. a trusted RPC that set app.premium_grant for this transaction
--      (garage_set_listing_premium_with_credit, apply_listing_premium_purchase)
--   2. a request carrying no end-user JWT -- the service_role key (Stripe webhook,
--      admin API routes), cron, or direct SQL. RLS already governs which rows those
--      callers may touch at all.
--   3. a profiles.role = 'admin' user -- the backend Premium toggle in the admin
--      dashboard, which stays fully functional.
--
-- Listings that are premium today are untouched: the trigger only fires when a
-- premium column actually CHANGES, so existing grants are preserved as-is.

CREATE OR REPLACE FUNCTION public.enforce_listing_premium_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_changed := COALESCE(NEW.premium, false)
              OR COALESCE(NEW.is_premium, false)
              OR NEW.premium_until IS NOT NULL;
  ELSE
    v_changed := (COALESCE(NEW.premium, false) IS DISTINCT FROM COALESCE(OLD.premium, false))
              OR (COALESCE(NEW.is_premium, false) IS DISTINCT FROM COALESCE(OLD.is_premium, false))
              OR (NEW.premium_until IS DISTINCT FROM OLD.premium_until);
  END IF;

  -- A write that leaves every premium column as it was is always fine: the admin
  -- edit modal, for instance, re-sends premium/premium_until on every save.
  IF NOT v_changed THEN
    RETURN NEW;
  END IF;

  -- 1. Trusted RPC. set_config(..., true) is transaction-local, so the grant
  --    cannot leak past the statement that opened it, and no exposed RPC lets a
  --    client set it directly.
  IF COALESCE(current_setting('app.premium_grant', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  -- 2. No end-user JWT: service_role key, cron, or direct SQL.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3. Admin backend.
  IF public.get_my_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'premium_not_grantable_by_owner'
    USING HINT = 'Premium is granted by the Stripe billing webhook, a garage premium credit, or an admin.';
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_listing_premium_authority ON public.listings;

CREATE TRIGGER trg_enforce_listing_premium_authority
BEFORE INSERT OR UPDATE OF premium, is_premium, premium_until ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listing_premium_authority();

-- The garage premium-credit path runs as the calling garage owner (SECURITY
-- INVOKER, so RLS still applies to it) and already proves ownership, an active
-- plan, and an unused credit before it writes. Re-declared here only to open the
-- transaction-local grant ahead of its UPDATE; the body is otherwise unchanged.
CREATE OR REPLACE FUNCTION public.garage_set_listing_premium_with_credit(listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_listing record;
  v_dealer_id uuid;
  v_period text := to_char((now() at time zone 'utc'), 'YYYYMM');
  v_included int := 0;
  v_used int := 0;
BEGIN
  SELECT l.id, l.created_by, l.garage_id INTO v_listing
  FROM public.listings l
  WHERE l.id = listing_id;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.created_by IS NULL OR v_listing.created_by <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_dealer_id := v_listing.garage_id;
  IF v_dealer_id IS NULL THEN
    RAISE EXCEPTION 'Listing is not linked to a garage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = v_dealer_id AND g.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.dealer_has_entitlement(v_dealer_id) THEN
    RAISE EXCEPTION 'Garage has no active plan';
  END IF;

  PERFORM public.ensure_dealer_premium_credits(v_dealer_id, v_period);

  SELECT credits_included, credits_used INTO v_included, v_used
  FROM public.dealer_premium_credits
  WHERE dealer_id = v_dealer_id AND period_yyyymm = v_period
  FOR UPDATE;

  IF v_used >= v_included THEN
    RAISE EXCEPTION 'No premium credits left for this month';
  END IF;

  UPDATE public.dealer_premium_credits
  SET credits_used = credits_used + 1,
      updated_at = now()
  WHERE dealer_id = v_dealer_id AND period_yyyymm = v_period;

  PERFORM set_config('app.premium_grant', 'on', true);

  UPDATE public.listings
  SET
    premium = true,
    is_premium = true,
    premium_until = now() + interval '30 days',
    updated_at = now()
  WHERE id = listing_id;

  PERFORM set_config('app.premium_grant', 'off', true);

  RETURN jsonb_build_object(
    'ok', true,
    'dealer_id', v_dealer_id,
    'period', v_period
  );
END;
$function$;

-- Stripe fulfilment for the standalone "Premium für CHF 30 kaufen" checkout. Runs
-- from the webhook under the service_role key, so rule 2 would already cover it;
-- the explicit grant keeps it working if it is ever called from a user session.
CREATE OR REPLACE FUNCTION public.apply_listing_premium_purchase(
  stripe_checkout_session_id text,
  listing_id uuid,
  user_id uuid,
  amount_chf integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer;
BEGIN
  INSERT INTO public.listing_premium_purchases (
    stripe_checkout_session_id,
    listing_id,
    user_id,
    amount_chf,
    currency
  )
  VALUES (
    stripe_checkout_session_id,
    listing_id,
    user_id,
    amount_chf,
    'CHF'
  )
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    RETURN;
  END IF;

  PERFORM set_config('app.premium_grant', 'on', true);

  UPDATE public.listings
  SET
    premium = true,
    is_premium = true,
    premium_until = CASE
      WHEN premium_until IS NOT NULL AND premium_until > now()
        THEN premium_until + interval '30 days'
      ELSE now() + interval '30 days'
    END
  WHERE id = listing_id;

  PERFORM set_config('app.premium_grant', 'off', true);
END;
$function$;
