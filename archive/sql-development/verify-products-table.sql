-- Verify that the products table exists and has the correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'products'
ORDER BY 
    ordinal_position;

-- Check if the imageUrl column specifically exists
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns 
WHERE 
    table_name = 'products' 
    AND column_name = 'imageUrl';

-- Try to insert a test product directly
INSERT INTO products (name, description, categories, price, imageUrl, stock)
VALUES ('Test Product', 'Test description', ARRAY['Test'], 19.99, 'https://example.com/test.jpg', 5)
RETURNING *;

-- Clean up the test product
DELETE FROM products WHERE name = 'Test Product' AND description = 'Test description';