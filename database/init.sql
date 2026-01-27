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
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  
  CONSTRAINT fk_settings_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE
);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_customer_id ON settings(customer_id);

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

-- =====================================================
-- INITIALIZATION COMPLETE
-- =====================================================
