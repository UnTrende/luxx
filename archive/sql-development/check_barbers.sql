-- Check all barbers and their IDs
SELECT 
    id,
    user_id,
    name,
    email
FROM barbers 
ORDER BY created_at DESC;

-- Check auth.users table to see the relationship
SELECT 
    id,
    email,
    raw_app_meta_data
FROM auth.users 
WHERE id IN (SELECT user_id FROM barbers WHERE user_id IS NOT NULL)
ORDER BY created_at DESC;