-- Fix: The unique constraint should only prevent duplicate ACTIVE bookings
-- Completed and cancelled bookings should not block future bookings at the same time

-- Drop the old constraint
DROP INDEX IF EXISTS idx_bookings_barber_date_time_unique;

-- Recreate constraint to only check for pending and confirmed bookings
-- Completed and cancelled bookings don't block the slot
CREATE UNIQUE INDEX idx_bookings_barber_date_time_unique
ON bookings(barber_id, date, timeslot) 
WHERE status IN ('pending', 'confirmed');
