-- Create settings table to store site configuration including logo and hero images
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'site_settings',
  site_name TEXT DEFAULT 'BARBERSHOP',
  logo_path TEXT,
  logo_bucket TEXT DEFAULT 'product-images',
  hero_images JSONB DEFAULT '[]',
  allow_signups BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO settings (id) 
VALUES ('site_settings') 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Settings are viewable by everyone" ON settings
  FOR SELECT USING (true);

-- Allow admin updates to settings
CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = (SELECT auth.uid()) 
      AND app_users.role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON TABLE settings TO anon, authenticated;