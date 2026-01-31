-- =====================================================
-- ADD MISSING TABLES AND COLUMNS
-- =====================================================
-- This script adds missing tables and columns to existing database
-- Safe to run - won't delete existing data
-- Run this if you're missing: item_code_prefixes, sales_customers, etc.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to customers table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_admin') THEN
    ALTER TABLE customers ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
    ALTER TABLE customers ADD COLUMN customer_type VARCHAR(50) DEFAULT 'sales person';
  END IF;
END $$;

-- Add missing column to categories table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
    ALTER TABLE categories ADD COLUMN icon VARCHAR(255);
  END IF;
END $$;

-- Add missing columns to items table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'display_name') THEN
    ALTER TABLE items ADD COLUMN display_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'purchase_qty') THEN
    ALTER TABLE items ADD COLUMN purchase_qty INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add missing column to transactions table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sales_customer_id') THEN
    ALTER TABLE transactions ADD COLUMN sales_customer_id UUID;
  END IF;
END $$;

-- Add missing column to companies table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_type') THEN
    ALTER TABLE companies ADD COLUMN business_type VARCHAR(50);
  END IF;
END $$;

-- Add missing column to settings table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'receipt_auto_print') THEN
    ALTER TABLE settings ADD COLUMN receipt_auto_print BOOLEAN DEFAULT true;
    UPDATE settings SET receipt_auto_print = true WHERE receipt_auto_print IS NULL;
  END IF;
END $$;

-- =====================================================
-- CREATE MISSING TABLES
-- =====================================================

-- Item Code Prefixes
CREATE TABLE IF NOT EXISTS item_code_prefixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_code_prefixes_prefix ON item_code_prefixes(prefix);

-- Sales Customers
CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  place VARCHAR(255),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_customers_mobile ON sales_customers(mobile);

-- Quick Sale Items
CREATE TABLE IF NOT EXISTS quick_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  sold_at TIMESTAMPTZ(6) DEFAULT NOW(),
  added_to_inventory BOOLEAN DEFAULT false NOT NULL,
  inventory_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_sale_items_added_to_inventory ON quick_sale_items(added_to_inventory);
CREATE INDEX IF NOT EXISTS idx_quick_sale_items_inventory_item_id ON quick_sale_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_quick_sale_items_sold_at ON quick_sale_items(sold_at);

-- Cash Flow Entries
CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  entry_date TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_customer_id ON cash_flow_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_entry_date ON cash_flow_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON cash_flow_entries(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_category ON cash_flow_entries(category);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type VARCHAR(50) NOT NULL,
  page VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false NOT NULL,
  can_edit BOOLEAN DEFAULT false NOT NULL,
  can_delete BOOLEAN DEFAULT false NOT NULL,
  can_view_profit BOOLEAN DEFAULT false NOT NULL,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT uq_permissions_customer_type_page UNIQUE (customer_type, page)
);

CREATE INDEX IF NOT EXISTS idx_permissions_customer_type ON permissions(customer_type);
CREATE INDEX IF NOT EXISTS idx_permissions_page ON permissions(page);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  items_json TEXT NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi')),
  sales_customer_id UUID REFERENCES sales_customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);

-- Tables (for cafe)
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  capacity INTEGER DEFAULT 4 NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT uq_tables_customer_table_number UNIQUE (customer_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_customer_id ON tables(customer_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- Table Orders (for cafe)
CREATE TABLE IF NOT EXISTS table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  items_json TEXT NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_amount DECIMAL(10, 2),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi')),
  transaction_id UUID UNIQUE REFERENCES transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_orders_customer_id ON table_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_table_id ON table_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON table_orders(status);
CREATE INDEX IF NOT EXISTS idx_table_orders_created_at ON table_orders(created_at DESC);

-- =====================================================
-- ADD FOREIGN KEYS
-- =====================================================

-- Add foreign key for transactions.sales_customer_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_sales_customer' 
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT fk_transactions_sales_customer 
    FOREIGN KEY (sales_customer_id) 
    REFERENCES sales_customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for transactions.sales_customer_id
CREATE INDEX IF NOT EXISTS idx_transactions_sales_customer_id ON transactions(sales_customer_id);

-- Add index for customers.customer_type
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);

-- =====================================================
-- ADD TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for new tables
DROP TRIGGER IF EXISTS trigger_update_item_code_prefixes_updated_at ON item_code_prefixes;
CREATE TRIGGER trigger_update_item_code_prefixes_updated_at
  BEFORE UPDATE ON item_code_prefixes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sales_customers_updated_at ON sales_customers;
CREATE TRIGGER trigger_update_sales_customers_updated_at
  BEFORE UPDATE ON sales_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_quick_sale_items_updated_at ON quick_sale_items;
CREATE TRIGGER trigger_update_quick_sale_items_updated_at
  BEFORE UPDATE ON quick_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_cash_flow_entries_updated_at ON cash_flow_entries;
CREATE TRIGGER trigger_update_cash_flow_entries_updated_at
  BEFORE UPDATE ON cash_flow_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_permissions_updated_at ON permissions;
CREATE TRIGGER trigger_update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_carts_updated_at ON carts;
CREATE TRIGGER trigger_update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_tables_updated_at ON tables;
CREATE TRIGGER trigger_update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_table_orders_updated_at ON table_orders;
CREATE TRIGGER trigger_update_table_orders_updated_at
  BEFORE UPDATE ON table_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE
-- =====================================================
