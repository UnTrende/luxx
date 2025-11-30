-- Fix the trigger function for handling new users
-- This function automatically creates a record in app_users when a user signs up via Supabase Auth

-- Drop and recreate the function to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new record into app_users table when a new user is created in auth.users
  -- Handle both possible field names for user metadata
  INSERT INTO public.app_users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.user_metadata->>'name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'role', NEW.user_metadata->>'role', 'customer')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If the user already exists, do nothing
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();