-- Revert the role change trigger that was added to log role changes
-- This removes the automatic logging of role changes

-- Drop the trigger
DROP TRIGGER IF EXISTS on_user_role_change ON app_users;

-- Drop the function
DROP FUNCTION IF EXISTS public.log_role_change();

-- Drop the table
DROP TABLE IF EXISTS public.role_change_log;