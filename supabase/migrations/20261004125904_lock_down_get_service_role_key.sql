-- public.get_service_role_key() is a SECURITY DEFINER wrapper around the Vault
-- secret 'supabase_service_role_key'. It was created outside the tracked
-- migrations and kept Postgres' default EXECUTE grant to PUBLIC plus Supabase's
-- default grants to anon and authenticated, so
--   POST /rest/v1/rpc/get_service_role_key
-- with nothing but the public anon key returned the service role key.
--
-- Its only legitimate callers are SECURITY DEFINER functions owned by postgres
-- (the notification triggers and select_buyer_and_mark_listing_sold) and
-- pg_cron jobs that run as postgres. Inside those, the EXECUTE check is made
-- against postgres, so they keep working without the client-role grants.
--
-- The same audit found more SECURITY DEFINER functions in public that anon
-- could call although no client does (get_all_users_with_profiles was one of
-- them; 20261004125412_drop_get_all_users_with_profiles drops it):
--   apply_listing_premium_purchase     grants 30 days of premium to any listing
--                                      for free; only the Stripe webhook and the
--                                      verify route call it, with the service role
--   ensure_dealer_subscription_exists  gives any garage an active 'starter'
--                                      subscription
--   sync_garage_plan_snapshot_from_subscription, sweep_expire_declined_listings,
--   archive_expired_listings           maintenance, called from definer
--                                      functions and cron
--   _get_listing_seller_user_id, admin_is_admin, get_user_role,
--   admin_downgrade_garage_to_private, supabase_url
--                                      internal helpers with no client caller
--
-- SECURITY DEFINER trigger functions can't be invoked through PostgREST, and
-- EXECUTE on a trigger function is checked when the trigger is created, not
-- when it fires. Revoking it is housekeeping that silences the advisor.
--
-- Everything the app calls via .rpc(), and get_my_role (evaluated by RLS
-- policies as the querying role), keeps its grants. postgres and service_role
-- keep EXECUTE on everything below.

revoke all on function public.get_service_role_key() from public, anon, authenticated;
revoke all on function public.apply_listing_premium_purchase(text, uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.ensure_dealer_subscription_exists(uuid) from public, anon, authenticated;
revoke all on function public.sync_garage_plan_snapshot_from_subscription(uuid) from public, anon, authenticated;
revoke all on function public.sweep_expire_declined_listings() from public, anon, authenticated;
revoke all on function public.archive_expired_listings() from public, anon, authenticated;
revoke all on function public._get_listing_seller_user_id(uuid) from public, anon, authenticated;
revoke all on function public.admin_is_admin(uuid) from public, anon, authenticated;
revoke all on function public.get_user_role(uuid) from public, anon, authenticated;
revoke all on function public.admin_downgrade_garage_to_private(uuid) from public, anon, authenticated;
revoke all on function public.supabase_url() from public, anon, authenticated;

do $$
declare
  fn record;
begin
  for fn in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and p.prorettype = 'trigger'::regtype
  loop
    execute format(
      'revoke all on function public.%I(%s) from public, anon, authenticated',
      fn.proname, fn.args
    );
  end loop;
end $$;

-- Fail the migration rather than leave any of these callable by a client role.
do $$
declare
  still_open text;
begin
  select string_agg(p.oid::regprocedure::text, ', ')
    into still_open
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and (
      p.proname in (
        'get_service_role_key',
        'apply_listing_premium_purchase', 'ensure_dealer_subscription_exists',
        'sync_garage_plan_snapshot_from_subscription',
        'sweep_expire_declined_listings', 'archive_expired_listings',
        '_get_listing_seller_user_id', 'admin_is_admin', 'get_user_role',
        'admin_downgrade_garage_to_private', 'supabase_url'
      )
      or (p.prosecdef and p.prorettype = 'trigger'::regtype)
    )
    and (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      or has_function_privilege('authenticated', p.oid, 'EXECUTE')
    );

  if still_open is not null then
    raise exception 'still executable by anon/authenticated: %', still_open;
  end if;
end $$;

notify pgrst, 'reload schema';
