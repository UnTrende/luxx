-- Fix attendance table constraint to include new status values
-- This migration ensures the attendance status constraint allows all valid status values

-- First, let's drop any existing attendance status constraint
-- We need to be more thorough in finding and dropping the constraint
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check1;

ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check2;

-- Now add the new constraint with all valid status values
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('Present', 'Absent', 'Absent (Approved)', 'Logged Out', 'clocked-in', 'on-break', 'clocked-out'));