-- Automatic role synchronization between app_users and Supabase Auth metadata
-- This trigger automatically updates auth.users.raw_app_meta_data when app_users.role changes

-- Create or replace the function that syncs role changes to Auth metadata
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auth.users table to sync the role change
  -- Use raw_app_meta_data instead of raw_user_meta_data for proper authentication
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any existing trigger for safety
DROP TRIGGER IF EXISTS sync_user_role_trigger ON app_users;

-- Create trigger to auto-sync role to auth metadata
CREATE TRIGGER sync_user_role_trigger
AFTER INSERT OR UPDATE OF role ON app_users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_auth();

-- Update or recreate the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.user_metadata->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', NEW.user_metadata->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger on auth.users (if exists) and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();