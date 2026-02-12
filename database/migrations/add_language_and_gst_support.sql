-- =====================================================
-- LANGUAGE AND GST COMPLIANCE MIGRATION
-- =====================================================
-- Adds multi-language support and GST compliance features
-- Run this migration after the base schema is created

-- =====================================================
-- LANGUAGE SUPPORT UPDATES
-- =====================================================

-- Add language columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receipt_language VARCHAR(10) DEFAULT 'en';

-- Add language settings to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS language_settings JSONB DEFAULT '{}';

-- =====================================================
-- TRANSLATIONS TABLE
-- =====================================================
-- Stores custom translations for each customer

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_translations_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT uq_translations_customer_key_language UNIQUE(customer_id, key, language),
  CONSTRAINT chk_translations_language CHECK (language IN ('en', 'ta', 'hi', 'te', 'ml', 'bn'))
);

-- =====================================================
-- GST COMPLIANCE UPDATES
-- =====================================================

-- Add GST columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(8);
ALTER TABLE items ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS cess_rate DECIMAL(5,2) DEFAULT 0;

-- Add GST columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false;

-- =====================================================
-- E-WAY BILL TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS e_way_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  e_way_bill_number VARCHAR(12) UNIQUE,
  generated_date DATE,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_e_way_bills_transaction FOREIGN KEY (transaction_id) 
    REFERENCES transactions(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Translations indexes
CREATE INDEX IF NOT EXISTS idx_translations_customer_id ON translations(customer_id);
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_translations_customer_key ON translations(customer_id, key);

-- GST-related indexes
CREATE INDEX IF NOT EXISTS idx_items_hsn_code ON items(hsn_code) WHERE hsn_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_gst_rate ON items(gst_rate);

-- Transactions GST indexes
CREATE INDEX IF NOT EXISTS idx_transactions_place_of_supply ON transactions(place_of_supply) WHERE place_of_supply IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_gst_amount ON transactions(gst_amount) WHERE gst_amount > 0;

-- E-way bills indexes
CREATE INDEX IF NOT EXISTS idx_e_way_bills_transaction_id ON e_way_bills(transaction_id);
CREATE INDEX IF NOT EXISTS idx_e_way_bills_number ON e_way_bills(e_way_bill_number) WHERE e_way_bill_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_e_way_bills_status ON e_way_bills(status);
CREATE INDEX IF NOT EXISTS idx_e_way_bills_valid_until ON e_way_bills(valid_until);

-- =====================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- GST rate constraints
ALTER TABLE items ADD CONSTRAINT chk_items_gst_rate CHECK (gst_rate >= 0 AND gst_rate <= 100);
ALTER TABLE items ADD CONSTRAINT chk_items_cess_rate CHECK (cess_rate >= 0 AND cess_rate <= 100);

-- Transaction GST constraints
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_gst_amount CHECK (gst_amount >= 0);
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_cess_amount CHECK (cess_amount >= 0);

-- =====================================================
-- DEFAULT TRANSLATIONS SEED DATA
-- =====================================================
-- Insert default English translations (fallbacks)
INSERT INTO translations (customer_id, key, language, value)
SELECT 
  c.id,
  t.key,
  'en',
  t.value
FROM customers c, (VALUES 
  ('receipt.receipt', 'Receipt'),
  ('receipt.date', 'Date'),
  ('receipt.time', 'Time'),
  ('receipt.customer', 'Customer'),
  ('items.sno', '#'),
  ('items.item', 'Item'),
  ('items.rate', 'Rate'),
  ('items.qty', 'Qty'),
  ('items.amount', 'Amt'),
  ('totals.subtotal', 'Subtotal'),
  ('totals.discount', 'Discount'),
  ('totals.tax', 'GST/Tax'),
  ('totals.grandTotal', 'GRAND TOTAL'),
  ('payment.cashReceived', 'Cash Received'),
  ('payment.change', 'Change'),
  ('payment.method', 'Payment Method'),
  ('footer.thankYou', 'Thank You for Your Business!'),
  ('footer.visitAgain', 'Please visit again')
) AS t(key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations tr 
  WHERE tr.customer_id = c.id AND tr.key = t.key AND tr.language = 'en'
);

-- Insert default Tamil translations
INSERT INTO translations (customer_id, key, language, value)
SELECT 
  c.id,
  t.key,
  'ta',
  t.value
FROM customers c, (VALUES 
  ('receipt.receipt', 'ரசீது'),
  ('receipt.date', 'தேதி'),
  ('receipt.time', 'நேரம்'),
  ('receipt.customer', 'வாடிக்கையாளர்'),
  ('items.sno', 'எண்'),
  ('items.item', 'பொருள்'),
  ('items.rate', 'விலை'),
  ('items.qty', 'எண்ணிக்கை'),
  ('items.amount', 'தொகை'),
  ('totals.subtotal', 'கூட்டுத்தொகை'),
  ('totals.discount', 'தள்ளுபடி'),
  ('totals.tax', 'GST/வரி'),
  ('totals.grandTotal', 'மொத்தத் தொகை'),
  ('payment.cashReceived', 'பெறப்பட்ட பணம்'),
  ('payment.change', 'மாற்றம்'),
  ('payment.method', 'கட்டண முறை'),
  ('footer.thankYou', 'உங்கள் வணிகத்திற்கு நன்றி!'),
  ('footer.visitAgain', 'மீண்டும் வருகைத்தொடர்க')
) AS t(key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations tr 
  WHERE tr.customer_id = c.id AND tr.key = t.key AND tr.language = 'ta'
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp for translations
CREATE OR REPLACE FUNCTION update_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_translations_updated_at();

-- Update updated_at timestamp for e-way bills
CREATE OR REPLACE FUNCTION update_e_way_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_e_way_bills_updated_at
  BEFORE UPDATE ON e_way_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_e_way_bills_updated_at();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for items with GST information
CREATE OR REPLACE VIEW items_with_gst AS
SELECT 
  i.*,
  c.name as category_name,
  i.gst_rate,
  i.cess_rate,
  i.hsn_code,
  CASE 
    WHEN i.gst_rate > 0 THEN 'Taxable'
    ELSE 'Exempt'
  END as tax_status
FROM items i
LEFT JOIN categories c ON i.category_id = c.id;

-- View for transactions with GST breakdown
CREATE OR REPLACE VIEW transactions_with_gst AS
SELECT 
  t.*,
  t.gst_amount,
  t.cess_amount,
  t.place_of_supply,
  t.reverse_charge,
  (t.total_amount - COALESCE(t.gst_amount, 0) - COALESCE(t.cess_amount, 0)) as taxable_amount
FROM transactions t;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Migration completed successfully
DO $$
BEGIN
  RAISE NOTICE 'Language and GST compliance migration completed successfully';
  RAISE NOTICE '- Added language support to companies and settings tables';
  RAISE NOTICE '- Created translations table with default English and Tamil translations';
  RAISE NOTICE '- Added GST compliance columns to items and transactions';
  RAISE NOTICE '- Created e-way bills tracking table';
  RAISE NOTICE '- Added necessary indexes and constraints';
  RAISE NOTICE '- Created helpful views for GST reporting';
END $$;
