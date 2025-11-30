-- Enhance attendance table for detailed tracking
-- This migration adds clock in/out functionality, break tracking, and working hours calculation

-- Add new columns to the existing attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS barber_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS clock_in TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clock_out TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_duration INTEGER, -- minutes
ADD COLUMN IF NOT EXISTS working_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_start_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;

-- Update the status check constraint to include new statuses
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('Present', 'Absent', 'Absent (Approved)', 'Logged Out', 'clocked-in', 'on-break', 'clocked-out'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_in ON attendance(clock_in);

-- Update existing records to have barber_name
UPDATE public.attendance 
SET barber_name = (
    SELECT b.name 
    FROM public.barbers b 
    WHERE b.id = attendance.barber_id
)
WHERE barber_name IS NULL;

-- Create rosters table for schedule management
CREATE TABLE IF NOT EXISTS public.rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key VARCHAR(20) NOT NULL UNIQUE, -- Format: YYYY-W##
  week_dates JSONB NOT NULL, -- Array of 7 date strings
  schedules JSONB NOT NULL, -- Employee schedules object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_week_key CHECK (week_key ~ '^\d{4}-W\d{2}$')
);

-- Create indexes for rosters
CREATE INDEX IF NOT EXISTS idx_rosters_week_key ON rosters(week_key);
CREATE INDEX IF NOT EXISTS idx_rosters_created_by ON rosters(created_by);

-- Enable Row Level Security for rosters
ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rosters
CREATE POLICY "Admins can manage rosters"
  ON rosters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view rosters"
  ON rosters FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Update RLS policies for attendance to allow barbers to update their own records
DROP POLICY IF EXISTS "Barbers can view their own attendance records" ON attendance;
CREATE POLICY "Barbers can view their own attendance records" ON attendance
  FOR SELECT TO authenticated
  USING (
    barber_id IN (
      SELECT id FROM barbers 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Barbers can update own attendance records" ON attendance;
CREATE POLICY "Barbers can update own attendance records" ON attendance
  FOR UPDATE TO authenticated
  USING (
    barber_id IN (
      SELECT id FROM barbers 
      WHERE user_id = (SELECT auth.uid())
    )
  );