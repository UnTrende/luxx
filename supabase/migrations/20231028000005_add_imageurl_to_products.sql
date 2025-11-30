-- Add imageUrl column to products table if it doesn't exist
-- This migration ensures the products table has the imageUrl column that the Edge Functions expect

-- First, check if the products table exists, and create it if it doesn't
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  price NUMERIC(10,2) NOT NULL,
  imageUrl TEXT,
  stock INTEGER NOT NULL
);

-- If the table exists but the column doesn't, add the column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS imageUrl TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN products.imageUrl IS 'URL of the product image';

-- Ensure the column can be NULL initially
ALTER TABLE products 
ALTER COLUMN imageUrl DROP NOT NULL;

-- Grant necessary permissions
GRANT ALL ON TABLE products TO anon, authenticated;