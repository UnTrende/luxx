-- Fix: The unique constraint was using wrong column name (timeSlot vs timeslot)
-- Drop the old constraint with wrong column name
DROP INDEX IF EXISTS idx_bookings_barber_date_time_unique;

-- Recreate the constraint with the correct lowercase column name
CREATE UNIQUE INDEX idx_bookings_barber_date_time_unique
ON bookings(barber_id, date, timeslot) 
WHERE status != 'cancelled';

-- Add comment for clarity
COMMENT ON INDEX idx_bookings_barber_date_time_unique IS 'Prevents duplicate bookings for the same barber at the same date and time (excluding cancelled bookings)';
