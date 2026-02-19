-- Phase 1: Add profile fields to garages table
ALTER TABLE garages 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS header_image_url text,
ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS google_reviews_snippet jsonb DEFAULT '{}'::jsonb;

-- Add view tracking to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_garages_slug ON garages(slug);

-- Create function to safely increment listing views
CREATE OR REPLACE FUNCTION increment_listing_view(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE listings 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_listing_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_listing_view(uuid) TO authenticated, anon;