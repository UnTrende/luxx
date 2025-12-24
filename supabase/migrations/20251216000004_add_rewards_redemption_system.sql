-- Migration: Add Points Redemption/Rewards System
-- Allows customers to redeem points for free services

-- 1. Add redemption fields to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS redemption_points INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_redeemable BOOLEAN DEFAULT false;

-- 2. Add reward tracking to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS is_reward_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0;

-- 3. Add comments for documentation
COMMENT ON COLUMN services.redemption_points IS 'Points required to redeem this service for free';
COMMENT ON COLUMN services.is_redeemable IS 'Whether this service can be redeemed with points';
COMMENT ON COLUMN bookings.is_reward_booking IS 'True if this booking was paid with points instead of money';
COMMENT ON COLUMN bookings.points_redeemed IS 'Number of points deducted from customer for this reward booking';

-- 4. Update some sample services to be redeemable (optional - admin can configure via UI)
-- Uncomment below if you want default values:
-- UPDATE services SET is_redeemable = true, redemption_points = 100 WHERE name = 'Haircut';
-- UPDATE services SET is_redeemable = true, redemption_points = 50 WHERE name = 'Beard Trim';
