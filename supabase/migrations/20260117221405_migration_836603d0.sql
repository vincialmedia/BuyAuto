-- 1. Add columns to garages table
    ALTER TABLE public.garages 
    ADD COLUMN IF NOT EXISTS listing_limit INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

    -- 2. Add 'archived' to listing_status enum (if not exists)
    -- Postgres doesn't support IF NOT EXISTS for enum values easily in a single block, 
    -- so we wrap in a DO block
    DO $$
    BEGIN
      ALTER TYPE public.listing_status ADD VALUE 'archived';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- 3. Create the RPC function for safe publishing
    CREATE OR REPLACE FUNCTION public.publish_garage_listing(listing_id UUID)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_user_id UUID;
      v_is_garage BOOLEAN;
      v_limit INTEGER;
      v_current_count INTEGER;
      v_plan TEXT;
      v_result JSONB;
    BEGIN
      -- Get current user
      v_user_id := auth.uid();
      
      -- Check if listing belongs to user
      IF NOT EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'Listing not found or permission denied';
      END IF;

      -- Check if user is a garage and get limit
      SELECT 
        (p.role = 'garage'),
        COALESCE(g.listing_limit, 10),
        COALESCE(g.plan, 'free')
      INTO 
        v_is_garage,
        v_limit,
        v_plan
      FROM public.profiles p
      LEFT JOIN public.garages g ON g.owner_user_id = p.id
      WHERE p.id = v_user_id;

      -- If not a garage, just publish (or let private flow handle it - but this RPC is for garages)
      -- For robustness, we allow privates to use it but strictly apply garage limits to garages
      IF v_is_garage THEN
        -- Count active listings (published or active)
        SELECT COUNT(*)
        INTO v_current_count
        FROM public.listings
        WHERE user_id = v_user_id 
          AND status IN ('published', 'active');

        -- Enforce Limit
        IF v_current_count >= v_limit THEN
           RAISE EXCEPTION 'Limit erreicht: %/% aktive Inserate. Bitte archivieren Sie ein Inserat oder upgraden Sie Ihr Paket.', v_current_count, v_limit;
        END IF;
      END IF;

      -- Update status to published
      UPDATE public.listings
      SET 
        status = 'published',
        updated_at = NOW(),
        payment_status = 'not_applicable' -- Garages don't pay per listing
      WHERE id = listing_id
      RETURNING to_jsonb(listings.*) INTO v_result;

      RETURN v_result;
    END;
    $$;