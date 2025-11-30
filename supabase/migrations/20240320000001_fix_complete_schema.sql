-- COMPLETE DATABASE SCHEMA FIX
-- Fix barbers table
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Fix rosters table - REMOVED as it is handled in 20240320000002_complete_roster_schema_fix.sql
-- ALTER TABLE rosters 
-- ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
-- ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
-- ADD COLUMN IF NOT EXISTS created_by UUID;

-- Fix products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS image_bucket TEXT DEFAULT 'product-images',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing barbers with email data
UPDATE barbers 
SET email = app_users.email
FROM app_users 
WHERE barbers.id = app_users.id;

-- Create performance indexes
-- CREATE INDEX IF NOT EXISTS idx_rosters_start_date ON rosters(start_date); -- Handled in next migration
-- CREATE INDEX IF NOT EXISTS idx_rosters_end_date ON rosters(end_date); -- Handled in next migration
CREATE INDEX IF NOT EXISTS idx_barbers_email ON barbers(email);
CREATE INDEX IF NOT EXISTS idx_products_image_path ON products(image_path);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';