-- Add file path columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS image_bucket TEXT DEFAULT 'product-images';

-- Add file path columns to barbers table  
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS photo_path TEXT,
ADD COLUMN IF NOT EXISTS photo_bucket TEXT DEFAULT 'barber-photos';

-- Add file path columns to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS image_bucket TEXT DEFAULT 'service-images';