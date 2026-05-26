-- Add a stored logo_url column on garages so the URL is no longer inferred
-- from the storage path. The hardcoded `garage-logos/{id}/logo_medium.webp`
-- inference breaks when uploads fall back to JPEG (iOS Safari fix), since
-- the actual file extension can vary.

ALTER TABLE public.garages
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Update the public RPCs that surface garage data so consumers can read
-- logo_url alongside header_image_url. CREATE OR REPLACE can't change the
-- return column list, so drop and recreate.

DROP FUNCTION IF EXISTS public.get_public_garages(uuid[]);

CREATE FUNCTION public.get_public_garages(p_garage_ids uuid[])
RETURNS TABLE (
  id uuid,
  garage_name text,
  city text,
  slug text,
  description text,
  header_image_url text,
  logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    g.id,
    g.garage_name,
    g.city,
    g.slug,
    g.description,
    g.header_image_url,
    g.logo_url
  FROM public.garages g
  WHERE g.id = ANY(p_garage_ids);
$function$;

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
  logo_url text,
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
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    g.logo_url,
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
$function$;

-- Backfill: for garages that already uploaded a logo (file exists at the
-- legacy webp path), store the relative path. The frontend's
-- resolveListingImagesPublicUrl helper turns relative paths into full URLs.

UPDATE public.garages g
SET logo_url = 'garage-logos/' || g.id::text || '/logo_medium.webp'
WHERE g.logo_url IS NULL
  AND EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'listing-images'
      AND name = 'garage-logos/' || g.id::text || '/logo_medium.webp'
  );
