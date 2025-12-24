-- Migration: Add tier-specific loyalty points to services table
-- This allows admins to set different point values for Silver, Gold, and Platinum tiers

-- Add tier-specific loyalty points columns
ALTER TABLE services
ADD COLUMN IF NOT EXISTS loyalty_points_silver INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points_gold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points_platinum INTEGER DEFAULT 0;

-- Migrate existing loyalty_points data to silver tier (default tier)
UPDATE services
SET loyalty_points_silver = COALESCE(loyalty_points, 0),
    loyalty_points_gold = COALESCE(loyalty_points, 0),
    loyalty_points_platinum = COALESCE(loyalty_points, 0)
WHERE loyalty_points_silver = 0 AND loyalty_points_gold = 0 AND loyalty_points_platinum = 0;

-- Add comment for documentation
COMMENT ON COLUMN services.loyalty_points_silver IS 'Loyalty points awarded to Silver tier customers';
COMMENT ON COLUMN services.loyalty_points_gold IS 'Loyalty points awarded to Gold tier customers';
COMMENT ON COLUMN services.loyalty_points_platinum IS 'Loyalty points awarded to Platinum tier customers';

-- Keep the old loyalty_points column for backward compatibility but mark as deprecated
COMMENT ON COLUMN services.loyalty_points IS 'DEPRECATED: Use tier-specific columns instead';
