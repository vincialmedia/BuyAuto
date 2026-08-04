-- The admin "Neues Inserat zur Prüfung" email stopped arriving: the
-- on_listing_ready_for_review trigger still calls the
-- admin-new-listing-notification edge function with the project's hardcoded
-- ANON key (the original Nov 2025 wiring), but the edge function has since
-- been hardened to accept only the service-role key
-- (requireServiceAuthorization). Every call since that deploy died with
-- 401 Unauthorized — visible in net._http_response and the edge-function
-- logs — so no admin review email went out (e.g. the Mercedes AMG CLA 35
-- submitted 2026-08-04 ~16:07 UTC).
--
-- Rebuild the trigger function on the pattern the other notification
-- triggers already use (handle_listing_status_change,
-- handle_new_message_email): resolve the service-role key from Vault via
-- public.get_service_role_key() and the project URL via
-- public.supabase_url(), and never let a notification failure abort the
-- listing write.

create or replace function public.handle_new_listing_notification()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  fn_url text;
  svc_key text;
  should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    should_notify := (new.status = 'pending' and new.payment_status = 'paid');
  elsif tg_op = 'UPDATE' then
    -- Only when the row transitions INTO the pending+paid state.
    should_notify := (new.status = 'pending' and new.payment_status = 'paid')
      and (old.status is distinct from 'pending' or old.payment_status is distinct from 'paid');
  end if;

  if not should_notify then
    return new;
  end if;

  svc_key := public.get_service_role_key();
  if svc_key is null or length(svc_key) = 0 then
    raise warning 'handle_new_listing_notification: missing service role key';
    return new;
  end if;

  fn_url := rtrim(trim(public.supabase_url()), '/') || '/functions/v1/admin-new-listing-notification';

  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body := jsonb_build_object('record', to_jsonb(new)),
    timeout_milliseconds := 15000
  );

  return new;
exception
  when others then
    raise warning 'handle_new_listing_notification exception for listing %: %', new.id, sqlerrm;
    return new;
end;
$function$;

-- Ensure the trigger is present and points at the function (idempotent).
drop trigger if exists on_listing_ready_for_review on public.listings;
create trigger on_listing_ready_for_review
after insert or update on public.listings
for each row execute function public.handle_new_listing_notification();
