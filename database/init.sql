-- =====================================================
-- POS BILLING SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Complete database initialization script
-- Creates database, extensions, tables, indexes, and triggers
-- Run manually on local PostgreSQL installation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
-- Stores business customer accounts (POS system owners)

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  is_admin BOOLEAN DEFAULT false,
  customer_type VARCHAR(50) DEFAULT 'sales person',
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
-- Product categories for inventory organization

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subcategory VARCHAR(255),
  brand VARCHAR(255),
  icon VARCHAR(255),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_categories_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- =====================================================
-- ITEMS TABLE
-- =====================================================
-- Product inventory items

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  code VARCHAR(100) NOT NULL,
  barcode VARCHAR(255),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory VARCHAR(255),
  cost DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2),
  stock INTEGER DEFAULT 0 NOT NULL,
  purchase_qty INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_items_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) 
    REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT chk_items_cost CHECK (cost >= 0),
  CONSTRAINT chk_items_price CHECK (price >= 0),
  CONSTRAINT chk_items_stock CHECK (stock >= 0)
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
-- Sales transactions/bills

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sales_customer_id UUID,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi')),
  received_amount DECIMAL(10, 2),
  change_amount DECIMAL(10, 2),
  items_json TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_transactions_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_transaction_customer FOREIGN KEY (transaction_customer_id) 
    REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT chk_transactions_total_amount CHECK (total_amount >= 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_customer_id ON categories(customer_id);

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_customer_id ON items(customer_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_sales_customer_id ON transactions(sales_customer_id);

-- =====================================================
-- ACTIVITY LOGS TABLE
-- =====================================================
-- Tracks all changes made to items, categories, transactions, and company data

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('item', 'category', 'transaction', 'company')),
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changed_by UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  changes JSONB,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_activity_logs_changed_by FOREIGN KEY (changed_by) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_changed_by ON activity_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
-- Company information for each customer

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  gstin VARCHAR(50),
  website VARCHAR(255),
  logo TEXT,
  business_type VARCHAR(50) CHECK (business_type IN ('clothing', 'cafe', 'electrical')),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_companies_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_customer_id ON companies(customer_id);

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
-- Application settings for each customer

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_log_enabled BOOLEAN DEFAULT true,
  item_log_actions VARCHAR(20) DEFAULT 'update_delete' CHECK (item_log_actions IN ('all', 'update_delete')),
  receipt_header_option VARCHAR(20) DEFAULT 'both' CHECK (receipt_header_option IN ('logo', 'company_name', 'both')),
  receipt_auto_print BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_settings_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_customer_id ON settings(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_customer_id_unique ON settings(customer_id);

-- =====================================================
-- ITEM CODE PREFIXES TABLE
-- =====================================================
-- Prefixes for item code generation

CREATE TABLE IF NOT EXISTS item_code_prefixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Item code prefixes indexes
CREATE INDEX IF NOT EXISTS idx_item_code_prefixes_prefix ON item_code_prefixes(prefix);

-- =====================================================
-- SALES CUSTOMERS TABLE
-- =====================================================
-- Sales customers (buyers) for transactions

CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  place VARCHAR(255),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Sales customers indexes
CREATE INDEX IF NOT EXISTS idx_sales_customers_mobile ON sales_customers(mobile);

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

-- =====================================================
-- QUICK SALE ITEMS TABLE
-- =====================================================
-- Quick sale items (items sold without inventory)

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

-- Quick sale items indexes
CREATE INDEX IF NOT EXISTS idx_quick_sale_items_added_to_inventory ON quick_sale_items(added_to_inventory);
CREATE INDEX IF NOT EXISTS idx_quick_sale_items_inventory_item_id ON quick_sale_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_quick_sale_items_sold_at ON quick_sale_items(sold_at);

-- =====================================================
-- CASH FLOW ENTRIES TABLE
-- =====================================================
-- Income and expense entries

CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  entry_date TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_cash_flow_entries_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- Cash flow entries indexes
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_customer_id ON cash_flow_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_entry_date ON cash_flow_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON cash_flow_entries(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_category ON cash_flow_entries(category);

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
-- Page permissions for different customer types

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

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_customer_type ON permissions(customer_type);
CREATE INDEX IF NOT EXISTS idx_permissions_page ON permissions(page);

-- =====================================================
-- CARTS TABLE
-- =====================================================
-- Saved shopping carts

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  items_json TEXT NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi')),
  sales_customer_id UUID REFERENCES sales_customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- Carts indexes
CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);

-- =====================================================
-- TABLES (FOR CAFE BUSINESS TYPE)
-- =====================================================
-- Table management for cafe business type

CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  capacity INTEGER DEFAULT 4 NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_tables_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT uq_tables_customer_table_number UNIQUE (customer_id, table_number)
);

-- Tables indexes
CREATE INDEX IF NOT EXISTS idx_tables_customer_id ON tables(customer_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- =====================================================
-- TABLE ORDERS (FOR CAFE BUSINESS TYPE)
-- =====================================================
-- Table orders for cafe business type

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
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_table_orders_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_table_orders_table FOREIGN KEY (table_id) 
    REFERENCES tables(id) ON DELETE CASCADE
);

-- Table orders indexes
CREATE INDEX IF NOT EXISTS idx_table_orders_customer_id ON table_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_table_id ON table_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON table_orders(status);
CREATE INDEX IF NOT EXISTS idx_table_orders_created_at ON table_orders(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customers table
DROP TRIGGER IF EXISTS trigger_update_customers_updated_at ON customers;
CREATE TRIGGER trigger_update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for companies table
DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON companies;
CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for settings table
DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON settings;
CREATE TRIGGER trigger_update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tables table
DROP TRIGGER IF EXISTS trigger_update_tables_updated_at ON tables;
CREATE TRIGGER trigger_update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for table_orders table
DROP TRIGGER IF EXISTS trigger_update_table_orders_updated_at ON table_orders;
CREATE TRIGGER trigger_update_table_orders_updated_at
  BEFORE UPDATE ON table_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for item_code_prefixes table
DROP TRIGGER IF EXISTS trigger_update_item_code_prefixes_updated_at ON item_code_prefixes;
CREATE TRIGGER trigger_update_item_code_prefixes_updated_at
  BEFORE UPDATE ON item_code_prefixes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sales_customers table
DROP TRIGGER IF EXISTS trigger_update_sales_customers_updated_at ON sales_customers;
CREATE TRIGGER trigger_update_sales_customers_updated_at
  BEFORE UPDATE ON sales_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for quick_sale_items table
DROP TRIGGER IF EXISTS trigger_update_quick_sale_items_updated_at ON quick_sale_items;
CREATE TRIGGER trigger_update_quick_sale_items_updated_at
  BEFORE UPDATE ON quick_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cash_flow_entries table
DROP TRIGGER IF EXISTS trigger_update_cash_flow_entries_updated_at ON cash_flow_entries;
CREATE TRIGGER trigger_update_cash_flow_entries_updated_at
  BEFORE UPDATE ON cash_flow_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for permissions table
DROP TRIGGER IF EXISTS trigger_update_permissions_updated_at ON permissions;
CREATE TRIGGER trigger_update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for carts table
DROP TRIGGER IF EXISTS trigger_update_carts_updated_at ON carts;
CREATE TRIGGER trigger_update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIALIZATION COMPLETE
-- =====================================================
