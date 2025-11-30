-- Check detailed roster data to see what's in the days column
SELECT 
    id,
    name,
    start_date,
    end_date,
    days,
    created_at
FROM rosters 
ORDER BY created_at DESC
LIMIT 10;

-- Check the structure of days data in detail
SELECT 
    id,
    name,
    jsonb_array_elements(days) as day_data
FROM rosters 
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any shifts for the specific barber ID
SELECT 
    r.id,
    r.name,
    d.day_data->>'date' as shift_date,
    s.shift_data
FROM rosters r,
     jsonb_array_elements(r.days) as d(day_data),
     jsonb_array_elements(d.day_data->'shifts') as s(shift_data)
WHERE s.shift_data->>'barberId' = '9e3a68cb-ab6d-4f54-845c-767bba62d488'
ORDER BY r.created_at DESC, shift_date;