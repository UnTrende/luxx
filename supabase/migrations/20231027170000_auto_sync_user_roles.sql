-- Auto-sync user roles between app_users table and Supabase Auth metadata
-- This provides helper functions for administrators to sync roles manually

-- Function to update a user's role in both app_users table and auth metadata
-- This function should be called from an Edge Function with admin privileges
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
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
  
  -- Return success
  RETURN QUERY SELECT TRUE, 'User role updated in database. Remember to also update auth metadata via Edge Function.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View to help administrators see users and their roles
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  id,
  email,
  name,
  role
FROM public.app_users
ORDER BY name;