-- Fix handle_new_user function to properly handle user metadata during registration
-- This migration addresses the issue where new users are not being added to app_users table

-- Drop and recreate the function to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT DEFAULT '';
  user_role TEXT DEFAULT 'customer';
BEGIN
  -- Extract name and role from metadata with proper handling
  -- Try raw_user_meta_data first (new format)
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  -- Fallback to user_metadata (old format)
  ELSIF NEW.user_metadata IS NOT NULL THEN
    user_name := COALESCE(NEW.user_metadata->>'name', '');
    user_role := COALESCE(NEW.user_metadata->>'role', 'customer');
  END IF;
  
  -- Ensure role is valid
  IF user_role NOT IN ('customer', 'barber', 'admin') THEN
    user_role := 'customer';
  END IF;
  
  -- Insert a new record into app_users table when a new user is created in auth.users
  INSERT INTO public.app_users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_name,
    user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
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
    -- Log any other errors with more details
    RAISE WARNING 'Error in handle_new_user trigger: % | User ID: % | Email: % | Name: % | Role: %', 
      SQLERRM, NEW.id, NEW.email, user_name, user_role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();