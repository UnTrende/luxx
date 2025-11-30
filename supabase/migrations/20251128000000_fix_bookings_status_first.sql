-- Quick fix migration for bookings status issue
-- Run this BEFORE the main migration

-- Step 1: Check what status values currently exist
SELECT DISTINCT status, COUNT(*) as count 
FROM bookings 
GROUP BY status 
ORDER BY status;

-- Step 2: Update ALL bookings to lowercase, handling all variations
UPDATE bookings 
SET status = LOWER(TRIM(status))
WHERE status IS NOT NULL;

-- Step 3: Now normalize the specific variations
UPDATE bookings 
SET status = CASE 
  WHEN status IN ('confirm', 'confirmed') THEN 'confirmed'
  WHEN status IN ('complete', 'completed') THEN 'completed'
  WHEN status IN ('cancel', 'canceled', 'cancelled') THEN 'cancelled'
  WHEN status IN ('pend', 'pending') THEN 'pending'
  ELSE status
END;

-- Step 4: Check the results
SELECT DISTINCT status, COUNT(*) as count 
FROM bookings 
GROUP BY status 
ORDER BY status;

-- Expected result: only 'pending', 'confirmed', 'completed', 'cancelled'
