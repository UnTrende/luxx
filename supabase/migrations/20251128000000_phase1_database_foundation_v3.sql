-- ============================================================================
-- PHASE 1: DATABASE FOUNDATION FIXES (V3 - FINAL)
-- ============================================================================
-- Purpose: Critical schema fixes for data integrity and performance
-- Author: Architectural Rescue Mission
-- Date: 2025-11-28
-- Version: 3.0 (Fixes constraint ordering issue)
-- 
-- IMPORTANT: This migration makes significant changes. 
-- BACKUP YOUR DATABASE before running in production!
-- ============================================================================

-- ============================================================================
-- STEP 0: DROP OLD CONSTRAINTS FIRST (Critical for updates to work)
-- ============================================================================

-- Drop existing status constraints so we can update the data
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE product_orders DROP CONSTRAINT IF EXISTS product_orders_status_check;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

-- ============================================================================
-- STEP 1: DATA CLEANUP
-- ============================================================================

-- 1.1 Standardize status values to lowercase AND fix spellings
-- Affected tables: bookings, product_orders, attendance

-- Bookings: Fix spelling variations (canceled -> cancelled) and lowercase
UPDATE bookings 
SET status = CASE 
  WHEN LOWER(status) IN ('confirm', 'confirmed') THEN 'confirmed'
  WHEN LOWER(status) IN ('complete', 'completed') THEN 'completed'
  WHEN LOWER(status) IN ('cancel', 'canceled', 'cancelled') THEN 'cancelled'
  WHEN LOWER(status) IN ('pend', 'pending') THEN 'pending'
  ELSE LOWER(TRIM(status))
END;

-- Product orders: Normalize Reserved/PickedUp to standard values
UPDATE product_orders 
SET status = CASE 
  WHEN LOWER(status) IN ('reserved', 'reserve') THEN 'pending'
  WHEN LOWER(status) IN ('pickedup', 'picked_up', 'picked up', 'pickup') THEN 'delivered'
  WHEN LOWER(status) IN ('confirmed', 'confirm') THEN 'confirmed'
  WHEN LOWER(status) IN ('shipped', 'ship') THEN 'shipped'
  WHEN LOWER(status) IN ('delivered', 'deliver') THEN 'delivered'
  WHEN LOWER(status) IN ('cancelled', 'canceled', 'cancel') THEN 'cancelled'
  WHEN LOWER(status) = 'pending' THEN 'pending'
  ELSE LOWER(TRIM(status))
END;

-- Attendance: Normalize and standardize
UPDATE attendance 
SET status = CASE 
  WHEN LOWER(status) = 'present' THEN 'present'
  WHEN LOWER(status) = 'absent' THEN 'absent'
  WHEN LOWER(status) LIKE '%approved%' OR LOWER(status) = 'absent-approved' THEN 'absent-approved'
  WHEN LOWER(status) IN ('logged out', 'logged_out', 'clocked-out', 'clocked_out') THEN 'clocked-out'
  WHEN LOWER(status) IN ('late', 'tardy') THEN 'late'
  WHEN LOWER(status) IN ('clocked-in', 'clocked_in') THEN 'clocked-in'
  WHEN LOWER(status) IN ('on-break', 'on_break', 'break') THEN 'on-break'
  ELSE LOWER(TRIM(status))
END;

-- 1.2 Consolidate duplicate username fields in product_orders
UPDATE product_orders 
SET userName = COALESCE(userName, username, 'Unknown Customer')
WHERE userName IS NULL OR userName = '';

-- 1.3 Clear denormalized barber_name
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

-- 2.2 Add image_path to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_path TEXT;

COMMENT ON COLUMN products.image_path IS 'Storage path in Supabase bucket';

-- ============================================================================
-- STEP 3: ADD NEW STATUS CONSTRAINTS
-- ============================================================================

-- 3.1 Bookings status constraint
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- 3.2 Product orders status constraint
ALTER TABLE product_orders 
ADD CONSTRAINT product_orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- 3.3 Attendance status constraint
ALTER TABLE attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'absent-approved', 'late', 'clocked-in', 'on-break', 'clocked-out'));

-- ============================================================================
-- STEP 4: ADD UNIQUE CONSTRAINTS
-- ============================================================================

-- 4.1 One barber per user
ALTER TABLE barbers 
ADD CONSTRAINT barbers_user_id_unique UNIQUE(user_id);

-- 4.2 One attendance record per barber per day
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

ALTER TABLE products 
ADD CONSTRAINT products_price_positive CHECK (price > 0),
ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

ALTER TABLE services 
ADD CONSTRAINT services_price_positive CHECK (price > 0),
ADD CONSTRAINT services_duration_positive CHECK (duration > 0);

ALTER TABLE product_orders 
ADD CONSTRAINT product_orders_quantity_positive CHECK (quantity > 0);

ALTER TABLE bookings 
ADD CONSTRAINT bookings_price_non_negative CHECK (totalPrice >= 0);

ALTER TABLE rosters 
ADD CONSTRAINT rosters_dates_valid CHECK (end_date >= start_date);

-- ============================================================================
-- STEP 6: REMOVE DUPLICATE AND LEGACY FIELDS
-- ============================================================================

ALTER TABLE product_orders DROP COLUMN IF EXISTS username;

UPDATE barbers 
SET active = COALESCE(is_active, active, true)
WHERE is_active IS NOT NULL;

ALTER TABLE barbers DROP COLUMN IF EXISTS is_active;
ALTER TABLE attendance DROP COLUMN IF EXISTS barber_name;

ALTER TABLE rosters 
DROP COLUMN IF EXISTS week_key,
DROP COLUMN IF EXISTS week_dates,
DROP COLUMN IF EXISTS schedules;

-- ============================================================================
-- STEP 7: ADD PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_barber_date_time_unique
ON bookings(barber_id, date, timeSlot) 
WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON notifications(recipient_id, is_read) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_timestamp_desc ON product_orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
