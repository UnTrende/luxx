-- Function to verify products table structure
CREATE OR REPLACE FUNCTION verify_products_table()
RETURNS TABLE(
    table_exists BOOLEAN,
    imageurl_column_exists BOOLEAN,
    table_structure JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if products table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
    ) INTO table_exists;
    
    -- Check if imageUrl column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'imageUrl'
    ) INTO imageurl_column_exists;
    
    -- Get table structure
    SELECT jsonb_agg(
        jsonb_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable
        )
    ) INTO table_structure
    FROM information_schema.columns 
    WHERE table_name = 'products'
    ORDER BY ordinal_position;
    
    RETURN NEXT;
END;
$$;

-- Call the function
SELECT * FROM verify_products_table();