do $$
begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'service_inquiries'
      and t.tgname = 'on_service_inquiry_created'
      and not t.tgisinternal
  ) then

    create or replace function public.handle_new_service_inquiry_email()
    returns trigger
    language plpgsql
    security definer
    set search_path = public, extensions
    as $fn$
    declare
      svc_key text;
      fn_url text;
      recent_count integer;
      normalized_email text;
    begin
      normalized_email := lower(coalesce(new.email, ''));
      if normalized_email = '' then
        return new;
      end if;

      select count(*) into recent_count
      from public.service_inquiries si
      where lower(si.email) = normalized_email
        and si.created_at > now() - interval '1 hour';

      if recent_count > 3 then
        return new;
      end if;

      svc_key := public.get_service_role_key();
      fn_url := public.supabase_url() || '/functions/v1/service-inquiry-email';

      perform net.http_post(
        url := fn_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || svc_key
        ),
        body := jsonb_build_object('record', to_jsonb(new))
      );

      return new;
    end;
    $fn$;

    create trigger on_service_inquiry_created
    after insert on public.service_inquiries
    for each row
    execute function public.handle_new_service_inquiry_email();

  end if;
end$$;