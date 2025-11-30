-- ============================================================================
-- Add created_at column to bookings table (SAFE VERSION)
-- ============================================================================
-- Purpose: Track when bookings are created (not when they're scheduled for)
-- This enables "new bookings" metrics and proper audit trails
-- ============================================================================

-- Only proceed if bookings table exists
DO $$
BEGIN
  -- Check if bookings table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE bookings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
      RAISE NOTICE 'Added created_at column to bookings table';
    ELSE
      RAISE NOTICE 'created_at column already exists in bookings table';
    END IF;
    
    -- Update existing bookings to have a created_at timestamp
    UPDATE bookings 
    SET created_at = NOW()
    WHERE created_at IS NULL;
    
    -- Create index for performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'bookings' AND indexname = 'idx_bookings_created_at'
    ) THEN
      CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
      RAISE NOTICE 'Created index on bookings.created_at';
    ELSE
      RAISE NOTICE 'Index idx_bookings_created_at already exists';
    END IF;
    
  ELSE
    RAISE NOTICE 'Bookings table does not exist - skipping migration';
  END IF;
END $$;
