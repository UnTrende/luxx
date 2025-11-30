-- Create a function to sync user role changes from app_users table to Supabase Auth metadata
-- This function should be called manually or through an admin interface when updating user roles

-- Create the function
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata(user_id UUID, new_role TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('customer', 'barber', 'admin') THEN
    RETURN QUERY SELECT FALSE, 'Invalid role. Must be customer, barber, or admin.';
    RETURN;
  END IF;
  
  -- Update user role in app_users table
  UPDATE public.app_users 
  SET role = new_role 
  WHERE id = user_id;
  
  -- Note: We cannot directly update Supabase Auth metadata from a database function
  -- This would require calling an Edge Function or external API
  -- For now, we'll return a message indicating that auth metadata needs to be updated separately
  
  RETURN QUERY SELECT TRUE, 'User role updated in database. Remember to also update auth metadata via admin interface.';
END;
$$ LANGUAGE plpgsql;

-- Create a helper view to easily see users and their roles
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  id,
  email,
  name,
  role
FROM public.app_users
ORDER BY name;