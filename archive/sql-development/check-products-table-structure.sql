-- Check the complete structure of the products table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'products'
ORDER BY 
    ordinal_position;

-- Check if the table has any data
SELECT COUNT(*) as total_products FROM products;

-- Try to insert a test product directly
INSERT INTO products (name, description, categories, price, imageUrl, stock)
VALUES ('SQL Test Product', 'Inserted directly via SQL', ARRAY['SQL', 'Test'], 39.99, 'https://example.com/sql-test.jpg', 8)
RETURNING id, name, imageUrl;

-- Clean up the test product
DELETE FROM products WHERE name = 'SQL Test Product';