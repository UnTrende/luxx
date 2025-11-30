-- Revert the role sync function that was added
-- This removes the manual sync function for user roles

-- Drop the function
DROP FUNCTION IF EXISTS public.sync_user_role_to_metadata(UUID, TEXT);

-- Drop the view
DROP VIEW IF EXISTS public.user_roles_view;