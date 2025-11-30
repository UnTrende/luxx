-- Debug the actual roster data structure
SELECT 
    id,
    name,
    start_date,
    end_date,
    created_at,
    days
FROM rosters 
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any rosters at all
SELECT COUNT(*) as total_rosters FROM rosters;

-- Check the structure of the days JSONB column for the most recent roster
SELECT 
    id,
    name,
    jsonb_array_elements(days) as day_element
FROM rosters 
ORDER BY created_at DESC
LIMIT 1;