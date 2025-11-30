-- Run these SQL commands in the Supabase SQL editor

-- Create storage buckets for site assets
INSERT INTO storage.buckets (id, name, public) VALUES 
('site-logo', 'site-logo', true),
('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public can view site logo" ON storage.objects
FOR SELECT USING (bucket_id = 'site-logo');

CREATE POLICY "Public can view hero images" ON storage.objects
FOR SELECT USING (bucket_id = 'hero-images');

CREATE POLICY "Authenticated users can upload site assets" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('site-logo', 'hero-images'));

CREATE POLICY "Authenticated users can update site assets" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id IN ('site-logo', 'hero-images'));

CREATE POLICY "Authenticated users can delete site assets" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id IN ('site-logo', 'hero-images'));

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES 
('shop_name', '"BARBERSHOP"'),
('allow_signups', 'true')
ON CONFLICT (key) DO NOTHING;