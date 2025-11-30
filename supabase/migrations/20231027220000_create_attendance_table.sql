-- Create attendance table for tracking daily barber attendance
-- This table will store daily attendance records for barbers

-- Create the attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('Present', 'Absent', 'Absent (Approved)', 'Logged Out')) NOT NULL DEFAULT 'Absent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_barber_id ON attendance(barber_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_date_barber ON attendance(date, barber_id);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow admin to view all attendance records
CREATE POLICY "Admin can view all attendance records" ON attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Allow admin to insert attendance records
CREATE POLICY "Admin can insert attendance records" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Allow admin to update attendance records
CREATE POLICY "Admin can update attendance records" ON attendance
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Allow barbers to view their own attendance records
CREATE POLICY "Barbers can view their own attendance records" ON attendance
  FOR SELECT TO authenticated
  USING (
    barber_id IN (
      SELECT id FROM barbers 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Grant necessary permissions
GRANT ALL ON TABLE public.attendance TO authenticated;

-- Add a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance table
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial attendance records for today for all active barbers
INSERT INTO attendance (barber_id, date, status)
SELECT id, CURRENT_DATE, 'Absent'
FROM barbers
WHERE active = true
ON CONFLICT DO NOTHING;