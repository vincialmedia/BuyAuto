-- Sitemap lastmod for garage microsites: extend the public slug feed with the garage's
-- last change. Return type changes, so the function must be dropped first. Only slug +
-- timestamp are exposed — no contact data.

drop function if exists public.get_public_garage_slugs();

create function public.get_public_garage_slugs()
 returns table(slug text, updated_at timestamptz)
 language sql
 security definer
 set search_path to 'public'
as $function$
  select g.slug, coalesce(g.updated_at, g.created_at) as updated_at
  from public.garages g
  where g.slug is not null
    and length(btrim(g.slug)) > 0
  order by g.slug asc;
$function$;

grant execute on function public.get_public_garage_slugs() to anon, authenticated, service_role;
