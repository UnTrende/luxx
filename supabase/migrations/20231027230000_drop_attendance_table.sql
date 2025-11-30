-- Drop attendance table and related objects
-- This migration removes the attendance feature that was added previously

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop the attendance table if it exists
DROP TABLE IF EXISTS public.attendance;