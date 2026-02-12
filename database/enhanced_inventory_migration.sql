-- =====================================================
-- ENHANCED INVENTORY MANAGEMENT MIGRATION
-- =====================================================
-- This script implements the enhanced inventory plan with brands and suppliers
-- Replaces item code prefix system with comprehensive supplier and brand management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PHASE 1: CREATE NEW TABLES
-- =====================================================

-- Create Brand Master Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    
    CONSTRAINT uq_brands_customer_name UNIQUE (customer_id, name)
);

CREATE INDEX IF NOT EXISTS idx_brands_customer_id ON brands(customer_id);
CREATE INDEX IF NOT EXISTS idx_brands_code ON brands(code);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- Create Supplier Master Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gstin VARCHAR(50),
    pan_number VARCHAR(20),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    
    CONSTRAINT uq_suppliers_customer_name UNIQUE (customer_id, name),
    CONSTRAINT uq_suppliers_customer_code UNIQUE (customer_id, code)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_customer_id ON suppliers(customer_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_gstin ON suppliers(gstin);

-- Create Supplier-Brand Mapping Table
CREATE TABLE IF NOT EXISTS supplier_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    supplier_brand_code VARCHAR(100),
    is_preferred BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    
    CONSTRAINT uq_supplier_brands_mapping UNIQUE (customer_id, supplier_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_brands_customer_id ON supplier_brands(customer_id);
CREATE INDEX IF NOT EXISTS idx_supplier_brands_supplier_id ON supplier_brands(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_brands_brand_id ON supplier_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_supplier_brands_is_preferred ON supplier_brands(is_preferred);

-- =====================================================
-- PHASE 2: UPDATE ITEMS TABLE
-- =====================================================

-- Add new columns to items table for supplier and brand relationships
DO $$ 
BEGIN
  -- Brand relationship
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'brand_id') THEN
    ALTER TABLE items ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
  END IF;
  
  -- Supplier relationship
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'supplier_id') THEN
    ALTER TABLE items ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
  
  -- Enhanced code fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'supplier_code') THEN
    ALTER TABLE items ADD COLUMN supplier_code VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'manufacturer_code') THEN
    ALTER TABLE items ADD COLUMN manufacturer_code VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'internal_code') THEN
    ALTER TABLE items ADD COLUMN internal_code VARCHAR(100);
  END IF;
END $$;

-- Create indexes for new item columns
CREATE INDEX IF NOT EXISTS idx_items_brand_id ON items(brand_id);
CREATE INDEX IF NOT EXISTS idx_items_supplier_id ON items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_items_supplier_code ON items(supplier_code);
CREATE INDEX IF NOT EXISTS idx_items_manufacturer_code ON items(manufacturer_code);
CREATE INDEX IF NOT EXISTS idx_items_internal_code ON items(internal_code);

-- =====================================================
-- PHASE 3: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to automatically update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for new tables
DROP TRIGGER IF EXISTS trigger_update_brands_updated_at ON brands;
CREATE TRIGGER trigger_update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 4: MIGRATE EXISTING DATA
-- =====================================================

-- Create default supplier for existing items
INSERT INTO suppliers (id, customer_id, name, code, is_active)
SELECT 
    gen_random_uuid(),
    customer_id,
    'Default Supplier',
    'DEF001',
    true
FROM (
    SELECT DISTINCT customer_id FROM items
    WHERE customer_id NOT IN (
        SELECT DISTINCT customer_id FROM suppliers
    )
) AS unique_customers
ON CONFLICT (customer_id, name) DO NOTHING;

-- Create brands from existing item brand strings
INSERT INTO brands (id, customer_id, name, code, is_active)
SELECT 
    gen_random_uuid(),
    customer_id,
    brand,
    UPPER(REPLACE(SUBSTRING(brand, 1, 3), ' ', '_')),
    true
FROM (
    SELECT DISTINCT customer_id, brand 
    FROM items 
    WHERE brand IS NOT NULL 
    AND brand != ''
    AND brand NOT IN (
        SELECT DISTINCT name FROM brands
    )
) AS unique_brands
ON CONFLICT (customer_id, name) DO NOTHING;

-- Update items with brand references
UPDATE items 
SET brand_id = brands.id
FROM brands 
WHERE items.brand = brands.name 
AND items.customer_id = brands.customer_id
AND items.brand_id IS NULL;

-- =====================================================
-- PHASE 5: CLEANUP (OPTIONAL)
-- =====================================================

-- Note: The following section is commented out for safety.
-- Uncomment after verifying the migration is successful.

-- Drop item_code_prefixes table if no longer needed
-- DROP TABLE IF EXISTS item_code_prefixes CASCADE;

-- Remove old brand column from items after migration
-- ALTER TABLE items DROP COLUMN IF EXISTS brand;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check counts after migration
SELECT 'brands' as table_name, COUNT(*) as record_count FROM brands
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers  
UNION ALL
SELECT 'supplier_brands', COUNT(*) FROM supplier_brands
UNION ALL
SELECT 'items_with_brand', COUNT(*) FROM items WHERE brand_id IS NOT NULL
UNION ALL
SELECT 'items_with_supplier', COUNT(*) FROM items WHERE supplier_id IS NOT NULL;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Migration completed successfully
-- The enhanced inventory system is now ready for use
