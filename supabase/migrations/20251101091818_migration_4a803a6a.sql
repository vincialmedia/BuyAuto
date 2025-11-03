-- Step 2: Now make user_id NOT NULL
-- This ensures all future inquiries must have a user_id
ALTER TABLE listing_inquiries 
ALTER COLUMN user_id SET NOT NULL;