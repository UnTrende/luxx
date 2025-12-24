-- Add active column to products table for storefront filtering
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
