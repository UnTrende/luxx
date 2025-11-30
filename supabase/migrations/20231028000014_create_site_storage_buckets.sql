-- Create storage buckets for site assets
INSERT INTO storage.buckets (id, name, public) VALUES 
('site-logo', 'site-logo', true),
('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies (DROP existing policies first to avoid conflicts)
DROP POLICY IF EXISTS "Public can view site logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view hero images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload site assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update site assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete site assets" ON storage.objects;

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