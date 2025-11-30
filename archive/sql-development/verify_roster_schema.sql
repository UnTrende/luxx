-- Verify rosters table exists with correct columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rosters'
ORDER BY ordinal_position;