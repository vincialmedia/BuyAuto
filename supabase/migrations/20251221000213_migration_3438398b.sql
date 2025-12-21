-- 1. Drop the loose trigger that fires on every update
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- 2. Create a strict trigger that ONLY fires when email is confirmed
CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION handle_welcome_email();