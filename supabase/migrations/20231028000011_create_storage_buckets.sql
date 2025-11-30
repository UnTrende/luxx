-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
('product-images', 'product-images', true),
('barber-photos', 'barber-photos', true),
('service-images', 'service-images', true);

-- Set up storage policies to allow public read access
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Public can view barber photos" ON storage.objects
FOR SELECT USING (bucket_id = 'barber-photos');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE TO authenticated USING (true);