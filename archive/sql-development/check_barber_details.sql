-- Check all barbers and their IDs
SELECT 
    id,
    user_id,
    name,
    email,
    created_at
FROM barbers 
ORDER BY created_at DESC;

-- Check if the specific barber exists
SELECT 
    id,
    user_id,
    name,
    email
FROM barbers 
WHERE id = '9e3a68cb-ab6d-4f54-845c-767bba62d488' 
   OR user_id = '9e3a68cb-ab6d-4f54-845c-767bba62d488';