-- Create a trigger that logs role changes in app_users table
-- This can be used to implement automatic syncing in the future

-- Create a table to log role changes
CREATE TABLE IF NOT EXISTS public.role_change_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_role TEXT,
  new_role TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Create a function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if the role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_log (user_id, old_role, new_role)
    VALUES (NEW.id, OLD.role, NEW.role);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on app_users table
DROP TRIGGER IF EXISTS on_user_role_change ON app_users;

CREATE TRIGGER on_user_role_change
  AFTER UPDATE OF role ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- Grant necessary permissions
GRANT ALL ON TABLE public.role_change_log TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;