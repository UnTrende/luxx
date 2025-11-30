-- ============================================================================
-- PHASE 1: DATABASE FOUNDATION FIXES
-- ============================================================================
-- Purpose: Critical schema fixes for data integrity and performance
-- Author: Architectural Rescue Mission
-- Date: 2025-11-28
-- Estimated Time: Apply in development first, test thoroughly
-- 
-- IMPORTANT: This migration makes significant changes. 
-- BACKUP YOUR DATABASE before running in production!
-- ============================================================================

-- ============================================================================
-- STEP 1: DATA CLEANUP (Must happen BEFORE adding constraints)
-- ============================================================================

-- 1.1 Standardize status values to lowercase
-- Affected tables: bookings, product_orders, attendance
UPDATE bookings 
SET status = CASE 
  WHEN status IN ('Confirmed', 'confirmed') THEN 'confirmed'
  WHEN status IN ('Completed', 'completed') THEN 'completed'
  WHEN status IN ('Canceled', 'Cancelled', 'cancelled') THEN 'cancelled'
  WHEN status IN ('Pending', 'pending') THEN 'pending'
  ELSE lower(status)
END
WHERE status != lower(status);

UPDATE product_orders 
SET status = CASE 
  WHEN status IN ('Reserved', 'reserved') THEN 'pending'  -- Normalize Reserved to pending
  WHEN status IN ('PickedUp', 'pickedup', 'picked_up') THEN 'delivered'  -- Normalize to delivered
  WHEN status IN ('Confirmed', 'confirmed') THEN 'confirmed'
  WHEN status IN ('Shipped', 'shipped') THEN 'shipped'
  WHEN status IN ('Delivered', 'delivered') THEN 'delivered'
  WHEN status IN ('Cancelled', 'cancelled') THEN 'cancelled'
  ELSE lower(status)
END
WHERE status != lower(status);

UPDATE attendance 
SET status = CASE 
  WHEN status IN ('Present', 'present') THEN 'present'
  WHEN status IN ('Absent', 'absent') THEN 'absent'
  WHEN status IN ('Absent (Approved)') THEN 'absent-approved'
  WHEN status IN ('Logged Out', 'logged_out') THEN 'clocked-out'
  WHEN status IN ('Late', 'late') THEN 'late'
  ELSE lower(status)
END;

-- 1.2 Consolidate duplicate username fields in product_orders
-- Merge username into userName (keeping userName as the standard)
-- Handle case where username column might not exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'username') THEN
    EXECUTE 'UPDATE product_orders SET userName = COALESCE(userName, username, ''Unknown Customer'') WHERE userName IS NULL OR userName = ''''';
  END IF;
EXCEPTION WHEN undefined_column THEN
  -- Column doesn't exist, continue without error
  NULL;
END $$;

-- 1.3 Clear denormalized barber_name (will be retrieved via JOIN)
-- Keep the column for now but null it out - we'll drop it later after updating queries
UPDATE attendance SET barber_name = NULL WHERE barber_name IS NOT NULL;

-- ============================================================================
-- STEP 2: ADD MISSING COLUMNS
-- ============================================================================

-- 2.1 Add image columns to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_path TEXT;

COMMENT ON COLUMN services.image_url IS 'Public URL of service image';
COMMENT ON COLUMN services.image_path IS 'Storage path in Supabase bucket';

-- 2.2 Add image_path to products table (imageUrl already exists)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_path TEXT;

COMMENT ON COLUMN products.image_path IS 'Storage path in Supabase bucket';

-- ============================================================================
-- STEP 3: UPDATE STATUS CONSTRAINTS
-- ============================================================================

-- 3.1 Update bookings status constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- 3.2 Update product_orders status constraint
ALTER TABLE product_orders 
DROP CONSTRAINT IF EXISTS product_orders_status_check;

ALTER TABLE product_orders 
ADD CONSTRAINT product_orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- 3.3 Update attendance status constraint
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'absent-approved', 'late', 'clocked-in', 'on-break', 'clocked-out'));

-- ============================================================================
-- STEP 4: ADD UNIQUE CONSTRAINTS
-- ============================================================================

-- 4.1 One barber per user
-- First, check for duplicates (shouldn't exist, but safety first)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM barbers
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % duplicate user_id values in barbers table. Manual cleanup required.', duplicate_count;
  END IF;
END $$;

ALTER TABLE barbers 
ADD CONSTRAINT barbers_user_id_unique UNIQUE(user_id);

-- 4.2 One attendance record per barber per day
-- Check for duplicates first
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT barber_id, date, COUNT(*) as cnt
    FROM attendance
    GROUP BY barber_id, date
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % duplicate (barber_id, date) combinations. Manual cleanup required.', duplicate_count;
  END IF;
END $$;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_barber_date_unique UNIQUE(barber_id, date);

-- 4.3 One review per booking
ALTER TABLE reviews 
ADD CONSTRAINT reviews_booking_unique UNIQUE(booking_id);

-- 4.4 No duplicate service assignments per barber
ALTER TABLE barber_services 
ADD CONSTRAINT barber_services_unique UNIQUE(barber_id, service_id);

-- ============================================================================
-- STEP 5: ADD CHECK CONSTRAINTS FOR BUSINESS LOGIC
-- ============================================================================

-- 5.1 Products constraints
ALTER TABLE products 
ADD CONSTRAINT products_price_positive CHECK (price > 0),
ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

-- 5.2 Services constraints
ALTER TABLE services 
ADD CONSTRAINT services_price_positive CHECK (price > 0),
ADD CONSTRAINT services_duration_positive CHECK (duration > 0);

-- 5.3 Product orders constraints
ALTER TABLE product_orders 
ADD CONSTRAINT product_orders_quantity_positive CHECK (quantity > 0);

-- 5.4 Bookings constraints
ALTER TABLE bookings 
ADD CONSTRAINT bookings_price_non_negative CHECK (totalPrice >= 0);

-- 5.5 Rosters constraints
ALTER TABLE rosters 
ADD CONSTRAINT rosters_dates_valid CHECK (end_date >= start_date);

-- ============================================================================
-- STEP 6: REMOVE DUPLICATE AND LEGACY FIELDS
-- ============================================================================

-- 6.1 Drop duplicate username field from product_orders (data already merged)
ALTER TABLE product_orders 
DROP COLUMN IF EXISTS username;

-- 6.2 Drop duplicate is_active field from barbers (use 'active' instead)
-- First, sync any data if needed
UPDATE barbers 
SET active = COALESCE(is_active, active, true)
WHERE is_active IS NOT NULL;

ALTER TABLE barbers 
DROP COLUMN IF EXISTS is_active;

-- 6.3 Drop denormalized barber_name from attendance
-- NOTE: Update your queries to JOIN with barbers table instead
ALTER TABLE attendance 
DROP COLUMN IF EXISTS barber_name;

-- 6.4 Drop legacy roster fields (old schema)
ALTER TABLE rosters 
DROP COLUMN IF EXISTS week_key,
DROP COLUMN IF EXISTS week_dates,
DROP COLUMN IF EXISTS schedules;

-- ============================================================================
-- STEP 7: ADD PERFORMANCE INDEXES
-- ============================================================================

-- 7.1 Booking status filtering (common query)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 7.2 Prevent double-booking (composite index for unique slot check)
-- Partial index: only for non-cancelled bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_barber_date_time_unique
ON bookings(barber_id, date, timeSlot) 
WHERE status != 'cancelled';

-- 7.3 Fast unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON notifications(recipient_id, is_read) 
WHERE is_read = false;

-- 7.4 Product orders by status
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);

-- 7.5 Product orders chronological listing
CREATE INDEX IF NOT EXISTS idx_product_orders_timestamp_desc 
ON product_orders(timestamp DESC);

-- 7.6 Services by category filtering
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- 7.7 Reviews lookup by booking
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- ============================================================================
-- STEP 8: UPDATE COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT bookings_status_check ON bookings IS 
'Ensures status values are lowercase: pending, confirmed, completed, cancelled';

COMMENT ON CONSTRAINT product_orders_status_check ON product_orders IS 
'Ensures status values are lowercase: pending, confirmed, shipped, delivered, cancelled (was Reserved/PickedUp)';

COMMENT ON CONSTRAINT barbers_user_id_unique ON barbers IS 
'Prevents multiple barber profiles for the same user';

COMMENT ON CONSTRAINT attendance_barber_date_unique ON attendance IS 
'Prevents duplicate attendance records for the same barber on the same day';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify migration success)
-- ============================================================================

-- Check status standardization
-- SELECT DISTINCT status FROM bookings ORDER BY status;
-- SELECT DISTINCT status FROM product_orders ORDER BY status;
-- SELECT DISTINCT status FROM attendance ORDER BY status;

-- Check for remaining duplicates
-- SELECT user_id, COUNT(*) FROM barbers GROUP BY user_id HAVING COUNT(*) > 1;
-- SELECT barber_id, date, COUNT(*) FROM attendance GROUP BY barber_id, date HAVING COUNT(*) > 1;

-- Verify new columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'services' AND column_name IN ('image_url', 'image_path');

-- Check constraints
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
-- WHERE table_name IN ('products', 'services', 'bookings', 'product_orders');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1 Database Foundation migration completed successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Run verification queries above';
  RAISE NOTICE '   2. Test application functionality';
  RAISE NOTICE '   3. Proceed to Phase 2: Image Infrastructure';
END $$;
