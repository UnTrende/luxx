-- Update the trigger function to also set role in app_metadata for new users
-- This ensures that the role is available in the correct location for authentication

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
  
  -- Also set role in app_metadata (not user_metadata) for proper authentication
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data->>'role', NEW.user_metadata->>'role', 'customer'))
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If the user already exists, do nothing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();