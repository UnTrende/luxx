-- Check if the products table exists and has the correct structure
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'products' 
    AND column_name = 'imageUrl';

-- Also check all columns in the products table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'products'
ORDER BY 
    ordinal_position;