-- Test the automatic role synchronization trigger
-- This script will verify that role changes in app_users are automatically synced to auth metadata

-- First, check the current state of a test user (if exists)
SELECT 
  email,
  role AS current_table_role,
  (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE auth.users.id = app_users.id) AS current_auth_role
FROM app_users 
WHERE email = 'test@example.com';

-- If the user exists, update their role and check if it syncs
UPDATE app_users 
SET role = 'barber' 
WHERE email = 'test@example.com';

-- Check if the role was synced to auth metadata
SELECT 
  email,
  role AS updated_table_role,
  (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE auth.users.id = app_users.id) AS updated_auth_role,
  CASE 
    WHEN role = (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE auth.users.id = app_users.id) 
    THEN '✓ Sync Successful' 
    ELSE '✗ Sync Failed' 
  END AS sync_status
FROM app_users 
WHERE email = 'test@example.com';

-- Reset the role back to customer for testing purposes
UPDATE app_users 
SET role = 'customer' 
WHERE email = 'test@example.com';

-- Verify the reset worked
SELECT 
  email,
  role AS reset_table_role,
  (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE auth.users.id = app_users.id) AS reset_auth_role,
  CASE 
    WHEN role = (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE auth.users.id = app_users.id) 
    THEN '✓ Reset Successful' 
    ELSE '✗ Reset Failed' 
  END AS reset_status
FROM app_users 
WHERE email = 'test@example.com';