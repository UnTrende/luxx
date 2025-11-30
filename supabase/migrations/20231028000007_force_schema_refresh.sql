-- Force schema refresh for products table to resolve Edge Function schema cache issue

-- First, rename the existing imageUrl column
ALTER TABLE products RENAME COLUMN imageUrl TO imageUrl_old;

-- Add the imageUrl column back
ALTER TABLE products ADD COLUMN imageUrl TEXT;

-- Copy data from the old column to the new column
UPDATE products SET imageUrl = imageUrl_old WHERE imageUrl_old IS NOT NULL;

-- Drop the old column
ALTER TABLE products DROP COLUMN imageUrl_old;

-- Add a comment to document the column
COMMENT ON COLUMN products.imageUrl IS 'URL of the product image';

-- Ensure the column can be NULL initially
ALTER TABLE products ALTER COLUMN imageUrl DROP NOT NULL;