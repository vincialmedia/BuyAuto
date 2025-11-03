-- First, ensure we have a debug_logs table for capturing errors
CREATE TABLE IF NOT EXISTS debug_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_message TEXT,
  log_level TEXT DEFAULT 'INFO',
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make it accessible for reading
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read debug logs" ON debug_logs FOR SELECT USING (true);