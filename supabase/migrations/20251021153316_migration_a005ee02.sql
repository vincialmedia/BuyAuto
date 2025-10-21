-- Enable the pg_net extension to allow outbound HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage permissions on the net schema to the role used by database functions
GRANT USAGE ON SCHEMA net TO supabase_functions_admin;