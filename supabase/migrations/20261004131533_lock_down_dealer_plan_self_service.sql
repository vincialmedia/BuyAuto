-- Close the paths that let a garage owner (or, for the RPC, anyone holding the
-- anon key) grant themselves a dealer plan, listing limit or premium credits
-- without paying. Plan changes are only applied by the Stripe webhook
-- (service_role), SECURITY DEFINER sync functions (postgres) and admins.

-- 1. request_dealer_plan_change applied any active plan for free. Its owner
--    check (v_owner <> auth.uid()) is NULL when auth.uid() is NULL, so anon
--    callers passed it for any garage. No client calls it any more.
REVOKE EXECUTE ON FUNCTION public.request_dealer_plan_change(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_dealer_plan_change(uuid, text) TO service_role;

-- 2. dealer_subscriptions: owners could PATCH plan_id/status/current_period_end
--    directly; the AFTER UPDATE OF plan_id trigger then synced garages.plan and
--    listing_limit. Owners keep read access; only admins may write.
DROP POLICY IF EXISTS owners_can_update_own_subscriptions ON public.dealer_subscriptions;
CREATE POLICY admins_can_update_subscriptions ON public.dealer_subscriptions
  FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- 3. dealer_plan_changes is a billing log written by the webhook; owners
--    should not be able to forge 'applied' rows.
DROP POLICY IF EXISTS owners_can_insert_plan_changes ON public.dealer_plan_changes;
CREATE POLICY admins_can_insert_plan_changes ON public.dealer_plan_changes
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

-- 4. garages.plan / listing_limit are a snapshot of the subscription and are
--    what publish checks read. Owners still edit the rest of their garage.
CREATE OR REPLACE FUNCTION public.guard_garage_plan_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.get_my_role() = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A new garage has no plan until billing assigns one.
    new.plan := 'no_plan';
    new.listing_limit := 0;
    return new;
  end if;

  if new.plan is distinct from old.plan
     or new.listing_limit is distinct from old.listing_limit then
    raise exception 'Garage plan and listing limit are managed by billing'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_garage_plan_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_garage_plan_columns ON public.garages;
CREATE TRIGGER guard_garage_plan_columns
  BEFORE INSERT OR UPDATE ON public.garages
  FOR EACH ROW EXECUTE FUNCTION public.guard_garage_plan_columns();

-- 5. dealer_premium_credits: the owner UPDATE policy must stay because
--    garage_set_listing_premium_with_credit (SECURITY INVOKER) consumes a credit
--    through it. Clients may only spend credits, never refill or move them.
--    Rows are created by ensure_dealer_premium_credits (SECURITY DEFINER).
DROP POLICY IF EXISTS owners_can_insert_own_premium_credits ON public.dealer_premium_credits;
CREATE POLICY admins_can_insert_premium_credits ON public.dealer_premium_credits
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

CREATE OR REPLACE FUNCTION public.guard_dealer_premium_credits_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.get_my_role() = 'admin' then
    return new;
  end if;

  if new.dealer_id is distinct from old.dealer_id
     or new.period_yyyymm is distinct from old.period_yyyymm
     or new.credits_included is distinct from old.credits_included
     or new.credits_used < old.credits_used then
    raise exception 'Premium credits can only be consumed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_dealer_premium_credits_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_dealer_premium_credits_update ON public.dealer_premium_credits;
CREATE TRIGGER guard_dealer_premium_credits_update
  BEFORE UPDATE ON public.dealer_premium_credits
  FOR EACH ROW EXECUTE FUNCTION public.guard_dealer_premium_credits_update();
