-- Migration: Create Spending-Based Loyalty System
-- Description: Implements a tiered loyalty program based on confirmed visits with spending multipliers

-- 1. Add loyalty columns to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS total_confirmed_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS redeemable_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status_tier TEXT DEFAULT 'Silver',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Create loyalty_settings table for admin-configurable settings
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    service_rate_silver DECIMAL(10,2) DEFAULT 5.00,
    service_rate_gold DECIMAL(10,2) DEFAULT 10.00,
    service_rate_platinum DECIMAL(10,2) DEFAULT 15.00,
    silver_threshold INTEGER DEFAULT 100,
    gold_threshold INTEGER DEFAULT 200,
    platinum_threshold INTEGER DEFAULT 9999,
    late_cancellation_penalty INTEGER DEFAULT 500,
    no_show_penalty INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO loyalty_settings (id) 
VALUES ('default') 
ON CONFLICT (id) DO NOTHING;

-- 3. Create loyalty_transactions table to track point transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- 'EARNED', 'PENALTY', 'REDEEMED'
    points_amount INTEGER NOT NULL,
    description TEXT,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_users_total_confirmed_visits ON app_users(total_confirmed_visits);
CREATE INDEX IF NOT EXISTS idx_app_users_redeemable_points ON app_users(redeemable_points);
CREATE INDEX IF NOT EXISTS idx_app_users_status_tier ON app_users(status_tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

-- 5. Enable RLS (Row Level Security) on loyalty tables
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for loyalty_transactions (idempotent)
DROP POLICY IF EXISTS "Users can view their own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can view their own loyalty transactions" 
ON loyalty_transactions 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Admins can view all loyalty transactions" 
ON loyalty_transactions 
FOR SELECT 
TO authenticated 
USING ( EXISTS (
    SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'
));

-- 7. Create policies for loyalty_settings (idempotent)
DROP POLICY IF EXISTS "Everyone can view loyalty settings" ON loyalty_settings;
CREATE POLICY "Everyone can view loyalty settings" 
ON loyalty_settings 
FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Only admins can update loyalty settings" ON loyalty_settings;
CREATE POLICY "Only admins can update loyalty settings" 
ON loyalty_settings 
FOR UPDATE 
TO authenticated 
USING ( EXISTS (
    SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'
));