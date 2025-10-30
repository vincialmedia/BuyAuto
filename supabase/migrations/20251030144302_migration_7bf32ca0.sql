-- Step 1: Add user_id column to listing_inquiries table
ALTER TABLE listing_inquiries 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update existing rows to have a user_id (optional, for existing data)
-- We'll leave existing inquiries with NULL user_id as legacy data

-- Step 3: Drop the old public insert policy
DROP POLICY IF EXISTS "Allow public insert for inquiries" ON listing_inquiries;

-- Step 4: Create new RLS policies for authenticated users only

-- Allow authenticated users to insert inquiries with their own user_id
CREATE POLICY "Authenticated users can create inquiries" 
ON listing_inquiries 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view inquiries they sent
CREATE POLICY "Users can view their sent inquiries" 
ON listing_inquiries 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow listing owners to view inquiries for their listings
CREATE POLICY "Owners can view inquiries for their listings" 
ON listing_inquiries 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM listings 
    WHERE listings.id = listing_inquiries.listing_id 
    AND listings.user_id = auth.uid()
  )
);