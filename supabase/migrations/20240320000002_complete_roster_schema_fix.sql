-- COMPLETE ROSTERS TABLE FIX
-- Drop and recreate the rosters table with all required columns
DROP TABLE IF EXISTS rosters CASCADE;

CREATE TABLE rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_rosters_start_date ON rosters(start_date);
CREATE INDEX idx_rosters_end_date ON rosters(end_date);
CREATE INDEX idx_rosters_created_at ON rosters(created_at);

-- Fix barbers table if needed
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update barber emails from app_users
UPDATE barbers 
SET email = app_users.email
FROM app_users 
WHERE barbers.id = app_users.id;

-- FORCE SCHEMA CACHE REFRESH
NOTIFY pgrst, 'reload schema';

-- Verify the rosters table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rosters' 
ORDER BY ordinal_position;