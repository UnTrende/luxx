-- Check current state of user roles
-- This will show the email, table role, and auth role for comparison
SELECT 
  au.email,
  apu.role AS table_role,
  au.raw_app_meta_data->>'role' AS auth_role
FROM auth.users au
LEFT JOIN public.app_users apu ON au.id = apu.id;

-- Sync all roles from app_users to auth metadata
-- This updates the auth metadata to match the roles in the app_users table
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', (
    SELECT role FROM public.app_users WHERE app_users.id = auth.users.id
  ))
WHERE id IN (SELECT id FROM public.app_users);

-- Verify the sync worked
-- This shows the same information as the first query but with a sync status column
SELECT 
  au.email,
  apu.role AS table_role,
  au.raw_app_meta_data->>'role' AS auth_role,
  CASE 
    WHEN apu.role = au.raw_app_meta_data->>'role' THEN '✓ Synced'
    ELSE '✗ NOT SYNCED'
  END AS status
FROM auth.users au
LEFT JOIN public.app_users apu ON au.id = apu.id;