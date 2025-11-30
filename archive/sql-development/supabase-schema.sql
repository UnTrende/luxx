-- LuxeCut Barber Shop - Complete Database Schema
-- This script creates all required tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: app_users
-- Stores user profiles with roles
CREATE TABLE app_users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('customer', 'barber', 'admin')) NOT NULL
);

-- Table: barbers
-- Stores barber profiles and information
CREATE TABLE barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT,
  experience INTEGER,
  specialties TEXT[],
  rating NUMERIC(3,2),
  active BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL
);

-- Table: services
-- Stores available services
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL
);

-- Table: barber_services
-- Links barbers to services they offer with their prices
CREATE TABLE barber_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services ON DELETE CASCADE NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

-- Table: products
-- Stores products available for purchase
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  price NUMERIC(10,2) NOT NULL,
  imageUrl TEXT,
  stock INTEGER NOT NULL
);

-- Table: bookings
-- Stores appointment bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  userName TEXT NOT NULL,
  barber_id UUID REFERENCES barbers ON DELETE CASCADE NOT NULL,
  service_ids UUID[],
  date DATE NOT NULL,
  timeSlot TEXT NOT NULL,
  totalPrice NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('Confirmed', 'Completed', 'Canceled')) NOT NULL,
  reviewLeft BOOLEAN DEFAULT FALSE,
  cancelMessage TEXT
);

-- Table: product_orders
-- Stores product orders
CREATE TABLE product_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  userName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('Reserved', 'PickedUp')) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table: reviews
-- Stores customer reviews for barbers
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  barber_id UUID REFERENCES barbers ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings ON DELETE CASCADE NOT NULL
);

-- Table: notifications
-- Stores user notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT,
  message TEXT NOT NULL,
  payload JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: site_settings
-- Stores site configuration settings
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for testing
-- Sample services
INSERT INTO services (name, duration, price, category) VALUES
  ('Classic Haircut', 30, 40.00, 'Haircut'),
  ('Beard Trim', 15, 20.00, 'Beard Care'),
  ('Hot Towel Shave', 45, 50.00, 'Shaving'),
  ('Fade & Style', 45, 55.00, 'Haircut'),
  ('Head Shave', 30, 35.00, 'Shaving'),
  ('Kids Cut', 30, 30.00, 'Haircut');

-- Sample products
INSERT INTO products (name, description, categories, price, imageUrl, stock) VALUES
  ('Luxe Pomade', 'Strong hold, matte finish pomade for all-day style.', ARRAY['Haircut', 'Styling'], 25.00, 'https://picsum.photos/seed/pomade/300/300', 20),
  ('Beard Oil Elixir', 'Nourishing beard oil for a soft, healthy beard.', ARRAY['Beard Care', 'Shaving'], 30.00, 'https://picsum.photos/seed/oil/300/300', 15),
  ('Pro Styling Comb', 'Durable, anti-static comb for precision styling.', ARRAY['Haircut', 'Styling'], 15.00, 'https://picsum.photos/seed/comb/300/300', 30),
  ('Soothing Aftershave Balm', 'Calms and moisturizes skin after shaving.', ARRAY['Shaving', 'Head Shave'], 28.00, 'https://picsum.photos/seed/balm/300/300', 12),
  ('LuxeCut Signature Tee', 'Comfortable and stylish branded t-shirt.', ARRAY['Branded Merch'], 45.00, 'https://picsum.photos/seed/tee/300/300', 0);

-- Sample site settings
INSERT INTO site_settings (key, value) VALUES
  ('shop_name', 'LuxeCut Barber Shop'),
  ('allow_signups', 'true'),
  ('site_logo', 'https://picsum.photos/seed/logo/300/300');

-- Create indexes for better query performance
CREATE INDEX idx_barbers_user_id ON barbers(user_id);
CREATE INDEX idx_barber_services_barber_id ON barber_services(barber_id);
CREATE INDEX idx_barber_services_service_id ON barber_services(service_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_product_orders_user_id ON product_orders(user_id);
CREATE INDEX idx_product_orders_product_id ON product_orders(product_id);
CREATE INDEX idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_site_settings_key ON site_settings(key);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- app_users policies
CREATE POLICY "Users can view their own profile" ON app_users
  FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile" ON app_users
  FOR UPDATE USING (id = (select auth.uid()));

-- barbers policies
CREATE POLICY "Barbers are viewable by everyone" ON barbers
  FOR SELECT USING (active = true);

-- services policies
CREATE POLICY "Services are viewable by everyone" ON services
  FOR SELECT USING (true);

-- barber_services policies
CREATE POLICY "Barber services are viewable by everyone" ON barber_services
  FOR SELECT USING (true);

-- products policies
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (user_id = (select auth.uid()));

-- product_orders policies
CREATE POLICY "Users can view their own orders" ON product_orders
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own orders" ON product_orders
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (recipient_id = (select auth.uid()));

-- site_settings policies
CREATE POLICY "Site settings are viewable by everyone" ON site_settings
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON TABLE app_users TO anon, authenticated;
GRANT ALL ON TABLE barbers TO anon, authenticated;
GRANT ALL ON TABLE services TO anon, authenticated;
GRANT ALL ON TABLE barber_services TO anon, authenticated;
GRANT ALL ON TABLE products TO anon, authenticated;
GRANT ALL ON TABLE bookings TO anon, authenticated;
GRANT ALL ON TABLE product_orders TO anon, authenticated;
GRANT ALL ON TABLE reviews TO anon, authenticated;
GRANT ALL ON TABLE notifications TO anon, authenticated;
GRANT ALL ON TABLE site_settings TO anon, authenticated;