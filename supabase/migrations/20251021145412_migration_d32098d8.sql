CREATE OR REPLACE FUNCTION public.handle_new_user_debug()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.debug_logs (log_message)
  VALUES (jsonb_build_object(
    'message', 'New user signed up',
    'user_id', NEW.id,
    'email', NEW.email,
    'raw_user_meta_data', NEW.raw_user_meta_data
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists and create a new one pointing to our debug function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_debug();