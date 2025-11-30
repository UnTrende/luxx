-- Improve handle_new_user function to address timing issues with metadata availability
-- This migration enhances the user registration process to ensure new users are properly added to app_users table

-- Drop and recreate the function to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
  retry_count INTEGER := 0;
  max_retries INTEGER := 5;
BEGIN
  -- Try to get user metadata with retries to handle timing issues
  WHILE retry_count < max_retries LOOP
    -- Extract name and role from metadata (trying different possible locations)
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.user_metadata->>'name', '');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.user_metadata->>'role', 'customer');
    
    -- If we got meaningful data or this is the last retry, proceed
    IF user_name != '' OR user_role != 'customer' OR retry_count = max_retries - 1 THEN
      EXIT;
    END IF;
    
    -- Wait a bit before retrying (100ms)
    PERFORM pg_sleep(0.1);
    retry_count := retry_count + 1;
  END LOOP;
  
  -- Insert a new record into app_users table when a new user is created in auth.users
  INSERT INTO public.app_users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_name,
    user_role
  );
  
  -- Also set role in app_metadata for proper authentication
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', user_role)
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If the user already exists, do nothing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors
    RAISE WARNING 'Error in handle_new_user trigger: % | User ID: % | Email: %', SQLERRM, NEW.id, NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();