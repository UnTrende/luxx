-- Check all rosters and their shifts
SELECT 
    id,
    week_key,
    schedules->'days' as all_days
FROM rosters 
ORDER BY created_at DESC;

-- Check a specific roster's shifts in detail
SELECT 
    id,
    week_key,
    jsonb_array_elements(schedules->'days') as day_data
FROM rosters 
ORDER BY created_at DESC;