-- Check if roles are synced between app_users and auth
SELECT 
  au.email,
  apu.role AS table_role,
  au.raw_app_meta_data->>'role' AS auth_role,
  CASE 
    WHEN apu.role = au.raw_app_meta_data->>'role' THEN '✓ Synced'
    ELSE '✗ NOT SYNCED'
  END AS sync_status
FROM auth.users au
LEFT JOIN public.app_users apu ON au.id = apu.id
ORDER BY au.created_at DESC;