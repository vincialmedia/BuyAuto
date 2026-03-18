DROP FUNCTION IF EXISTS public.get_public_garage_by_slug(text);

CREATE FUNCTION public.get_public_garage_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  owner_user_id uuid,
  garage_name text,
  slug text,
  city text,
  contact_email text,
  phone_number text,
  website_url text,
  description text,
  header_image_url text,
  opening_hours jsonb,
  services jsonb,
  team_members jsonb,
  listing_limit integer,
  plan text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    g.id,
    g.owner_user_id,
    g.garage_name,
    g.slug,
    g.city,
    g.contact_email,
    g.phone_number,
    g.website_url,
    g.description,
    g.header_image_url,
    g.opening_hours,
    to_jsonb(g.services) AS services,
    COALESCE(g.team_members, '[]'::jsonb) AS team_members,
    g.listing_limit,
    g.plan,
    g.created_at,
    g.updated_at
  FROM public.garages g
  WHERE g.slug = p_slug
  LIMIT 1;
$$;