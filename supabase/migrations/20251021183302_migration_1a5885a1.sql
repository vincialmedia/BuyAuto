-- Create function to handle new inquiry and invoke Edge Function
CREATE OR REPLACE FUNCTION public.handle_new_inquiry()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  request_id INT;
BEGIN
  -- Get the Supabase project URL and service role key from environment
  function_url := current_setting('app.supabase_url', true) || '/functions/v1/send-inquiry-email';
  service_role_key := current_setting('app.supabase_service_role_key', true);
  
  -- Invoke the Edge Function asynchronously using pg_net
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'inquiry_id', NEW.id
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after insert on listing_inquiries
DROP TRIGGER IF EXISTS on_inquiry_created ON public.listing_inquiries;
CREATE TRIGGER on_inquiry_created
  AFTER INSERT ON public.listing_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_inquiry();

-- Enable RLS on listing_inquiries table if not already enabled
ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.listing_inquiries;
DROP POLICY IF EXISTS "Users can view their listing inquiries" ON public.listing_inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.listing_inquiries;

-- Allow anyone to insert inquiries (public form submission)
CREATE POLICY "Anyone can insert inquiries"
  ON public.listing_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to view inquiries for their own listings
CREATE POLICY "Users can view their listing inquiries"
  ON public.listing_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_inquiries.listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Allow admins to view all inquiries
CREATE POLICY "Admins can view all inquiries"
  ON public.listing_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );