-- File: supabase/migrations/20251216000000_fix_admin_booking_rls.sql
-- Fix: Allow admins to update booking status

-- Drop and recreate the UPDATE policy to include admin access
DROP POLICY IF EXISTS "Allow customers and assigned barbers to update bookings" ON public.bookings;

CREATE POLICY "Allow customers, barbers, and admins to update bookings"
ON public.bookings
FOR UPDATE
USING (
  -- Admins can update any booking
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR
  -- Customers can update their own bookings
  user_id = auth.uid()
  OR
  -- Barbers can update bookings assigned to them
  (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'barber'
    AND
    barber_id = (SELECT id FROM public.barbers WHERE user_id = auth.uid() LIMIT 1)
  )
)
WITH CHECK (
  -- Admins can update any booking
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR
  -- Customers can update their own bookings
  user_id = auth.uid()
  OR
  -- Barbers can update bookings assigned to them
  (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'barber'
    AND
    barber_id = (SELECT id FROM public.barbers WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Also fix the SELECT policy to allow admins to see all bookings
DROP POLICY IF EXISTS "Allow users to see their own bookings and barbers to see their assigned bookings" ON public.bookings;

CREATE POLICY "Allow users, barbers, and admins to see bookings"
ON public.bookings
FOR SELECT
USING (
  -- Admins can see all bookings
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR
  -- Customers can see their own bookings
  user_id = auth.uid()
  OR
  -- Barbers can see bookings assigned to them
  (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'barber'
    AND
    barber_id = (SELECT id FROM public.barbers WHERE user_id = auth.uid() LIMIT 1)
  )
);
