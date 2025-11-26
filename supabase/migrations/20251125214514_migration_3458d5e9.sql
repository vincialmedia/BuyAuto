-- Inspect the function definition to see if it has hardcoded params or URL
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_listing_notification';

-- Drop the duplicate trigger
DROP TRIGGER IF EXISTS on_listing_paid ON listings;