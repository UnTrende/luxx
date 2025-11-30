-- Ensure products table exists with correct structure
-- This migration ensures the products table has all required columns

-- Create the products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  price NUMERIC(10,2) NOT NULL,
  imageUrl TEXT,
  stock INTEGER NOT NULL
);

-- Add imageUrl column if it doesn't exist (for existing tables)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS imageUrl TEXT;

-- Ensure the column can be NULL initially
ALTER TABLE products 
ALTER COLUMN imageUrl DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.id IS 'Unique identifier for the product';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.description IS 'Product description';
COMMENT ON COLUMN products.categories IS 'Product categories as an array of strings';
COMMENT ON COLUMN products.price IS 'Product price in decimal format';
COMMENT ON COLUMN products.imageUrl IS 'URL of the product image';
COMMENT ON COLUMN products.stock IS 'Available stock quantity';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Grant necessary permissions
GRANT ALL ON TABLE products TO anon, authenticated;