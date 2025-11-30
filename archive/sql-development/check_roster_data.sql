-- Check the actual structure of roster data in the database
SELECT 
    id,
    name,
    start_date,
    end_date,
    days,
    created_at
FROM rosters 
ORDER BY created_at DESC
LIMIT 5;

-- Check the structure of the days JSONB column
SELECT 
    id,
    name,
    jsonb_array_elements(days) as day_data
FROM rosters 
ORDER BY created_at DESC
LIMIT 3;

-- Check a specific roster's days structure in detail
SELECT 
    id,
    name,
    days
FROM rosters 
WHERE id = (
    SELECT id 
    FROM rosters 
    ORDER BY created_at DESC 
    LIMIT 1
);