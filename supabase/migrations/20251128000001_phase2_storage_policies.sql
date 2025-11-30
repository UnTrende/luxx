-- ============================================================================
-- PHASE 2: STORAGE INFRASTRUCTURE & RLS
-- ============================================================================
-- Purpose: Create storage buckets and secure them with RLS policies
-- Author: Architectural Rescue Mission
-- Date: 2025-11-28
-- ============================================================================

-- 1. Create Buckets (if they don't exist)
-- Note: Buckets are usually created via API/Dashboard, but we can try via SQL extension if available
-- Otherwise, this serves as documentation for manual creation

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('luxecut-public', 'luxecut-public', true),
  ('luxecut-photos', 'luxecut-photos', true), -- Public read, auth write
  ('luxecut-admin', 'luxecut-admin', false)   -- Private, admin only
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for 'luxecut-public' (Services, Products, Site Assets)
-- Everyone can view
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'luxecut-public');

-- Only Admins can upload/update/delete
CREATE POLICY "Admin Upload Public" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'luxecut-public' 
    AND (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'admin')
  );

CREATE POLICY "Admin Update Public" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'luxecut-public' 
    AND (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'admin')
  );

CREATE POLICY "Admin Delete Public" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'luxecut-public' 
    AND (auth.jwt() ->> 'role' = 'admin' OR (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'admin')
  );

-- 3. RLS Policies for 'luxecut-photos' (Barber Portfolios)
-- Everyone can view
CREATE POLICY "Public Access Photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'luxecut-photos');

-- Barbers can upload their OWN photos
CREATE POLICY "Barber Upload Own Photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'luxecut-photos' 
    AND (auth.uid()::text = (storage.foldername(name))[1]) -- Enforce folder structure: /user_id/filename
  );

-- Barbers can update/delete their OWN photos
CREATE POLICY "Barber Manage Own Photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'luxecut-photos' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Admins can manage all photos
CREATE POLICY "Admin Manage All Photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'luxecut-photos' 
    AND (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'admin'
  );

-- 4. RLS Policies for 'luxecut-admin' (Internal Docs, Backups)
-- Only Admins can do anything
CREATE POLICY "Admin Full Access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'luxecut-admin' 
    AND (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'admin'
  );
