-- Fix RLS policies to improve performance by using subquery for auth.uid()
-- This prevents re-evaluation of auth.uid() for each row

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own orders" ON product_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON product_orders;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create new optimized policies
-- app_users policies
CREATE POLICY "Users can view their own profile" ON app_users
  FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile" ON app_users
  FOR UPDATE USING (id = (select auth.uid()));

-- bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (user_id = (select auth.uid()));

-- product_orders policies
CREATE POLICY "Users can view their own orders" ON product_orders
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own orders" ON product_orders
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (recipient_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (recipient_id = (select auth.uid()));