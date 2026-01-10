-- Create enum for inquiry types
CREATE TYPE service_inquiry_type AS ENUM ('uebernahme_begleiten', 'leasing_exit_full_service');

-- Create service_inquiries table
CREATE TABLE service_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vorname TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type service_inquiry_type NOT NULL,
  leasinggesellschaft TEXT,
  nachricht TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'new' NOT NULL,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE service_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all service inquiries"
  ON service_inquiries
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update service inquiries"
  ON service_inquiries
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can create service inquiries"
  ON service_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_service_inquiries_created_at ON service_inquiries(created_at DESC);
CREATE INDEX idx_service_inquiries_status ON service_inquiries(status);