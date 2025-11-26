-- Drop the redundant triggers to stop double emails
DROP TRIGGER IF EXISTS on_listing_paid ON listings;
DROP TRIGGER IF EXISTS on_listing_created_check_status ON listings;

-- Ensure we only have the one correct trigger
-- (The on_listing_ready_for_review trigger was created in the previous step, so we keep it)