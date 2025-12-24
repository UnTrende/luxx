-- ============================================================================
-- BILLING SYSTEM MIGRATION
-- ============================================================================
-- Purpose: Create comprehensive billing system with transactions tracking
-- Date: 2024-12-24
-- Features: Walk-in + Booking billing, Receipt generation, Analytics
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('walk-in', 'booking')),
  
  -- Services and Pricing
  services JSONB NOT NULL, -- Array of {service_id?, service_name, price}
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_rate DECIMAL(5,2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount DECIMAL(10,2) NOT NULL CHECK (tax_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Payment Information
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile')),
  
  -- Optional References
  barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Metadata
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- ============================================================================
-- STEP 2: ADD TRANSACTION REFERENCE TO BOOKINGS
-- ============================================================================

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: ADD TAX RATE TO SITE SETTINGS
-- ============================================================================

-- Add tax_rate to site_settings if it doesn't exist
DO $$
BEGIN
  -- Check if tax_rate setting exists
  IF NOT EXISTS (
    SELECT 1 FROM site_settings WHERE key = 'tax_rate'
  ) THEN
    INSERT INTO site_settings (key, value)
    VALUES ('tax_rate', '10.00');
  END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_type ON transactions(customer_type);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_phone ON transactions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_transaction_id ON bookings(transaction_id);

-- ============================================================================
-- STEP 5: CREATE RECEIPT NUMBER SEQUENCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  receipt_num TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Count today's transactions to get the next sequence number
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: TRX-YYYYMMDD-XXX
  receipt_num := 'TRX-' || today_date || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: CREATE TRIGGER TO AUTO-GENERATE RECEIPT NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_receipt_number ON transactions;
CREATE TRIGGER trigger_set_receipt_number
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_receipt_number();

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES
-- ============================================================================

-- Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can insert transactions
DROP POLICY IF EXISTS "Admins can create transactions" ON transactions;
CREATE POLICY "Admins can create transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Customers can view their own transactions
DROP POLICY IF EXISTS "Customers can view their own transactions" ON transactions;
CREATE POLICY "Customers can view their own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- ============================================================================
-- STEP 9: CREATE HELPER VIEW FOR TRANSACTION ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW v_transaction_analytics AS
SELECT 
  DATE(created_at) as transaction_date,
  customer_type,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_revenue,
  SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_revenue,
  SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_revenue,
  SUM(CASE WHEN payment_method = 'mobile' THEN total_amount ELSE 0 END) as mobile_revenue
FROM transactions
GROUP BY DATE(created_at), customer_type;

-- ============================================================================
-- STEP 10: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE transactions IS 'Records all billing transactions for both walk-in customers and booking completions';
COMMENT ON COLUMN transactions.customer_type IS 'Distinguishes between walk-in customers and booking-based transactions';
COMMENT ON COLUMN transactions.services IS 'JSONB array of service items: [{service_id?: string, service_name: string, price: number}]';
COMMENT ON COLUMN transactions.receipt_number IS 'Auto-generated unique receipt identifier (format: TRX-YYYYMMDD-XXX)';
COMMENT ON COLUMN transactions.booking_id IS 'Foreign key to bookings table if this transaction is for a booking completion';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
