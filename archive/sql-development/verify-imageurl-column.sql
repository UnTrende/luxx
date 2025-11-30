-- Verify that the imageUrl column exists in the products table
SELECT 
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

-- Try to insert a test product directly to see if the column works
INSERT INTO products (name, description, categories, price, imageUrl, stock)
VALUES ('Schema Test Product', 'Testing if imageUrl column works', ARRAY['Schema', 'Test'], 19.99, 'https://example.com/schema-test.jpg', 5)
RETURNING id, name, imageUrl;

-- Clean up the test product
DELETE FROM products WHERE name = 'Schema Test Product';