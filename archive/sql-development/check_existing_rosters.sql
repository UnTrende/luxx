-- Check if there are any rosters at all
SELECT COUNT(*) as total_rosters FROM rosters;

-- Check the structure of existing rosters
SELECT 
    id,
    name,
    start_date,
    end_date,
    created_at,
    days
FROM rosters 
ORDER BY created_at DESC
LIMIT 3;