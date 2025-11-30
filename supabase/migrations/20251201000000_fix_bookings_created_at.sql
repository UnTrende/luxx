-- ============================================================================
-- Add created_at column to bookings table
-- ============================================================================
-- Purpose: Track when bookings are created (not when they're scheduled for)
-- This enables "new bookings" metrics and proper audit trails
-- ============================================================================

-- Add created_at column to bookings table if it doesn't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing bookings to have a created_at timestamp
-- Use NOW() as default since we can't reliably convert date field
-- This is safe because we're only tracking NEW bookings from this point forward
UPDATE bookings 
SET created_at = NOW()
WHERE created_at IS NULL;

-- Create index for performance on "new bookings" queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
