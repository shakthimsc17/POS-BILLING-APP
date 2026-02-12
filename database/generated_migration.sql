-- =====================================================
-- Database Schema Migration Script
-- Generated on: 2026-02-12T08:27:16.008Z
-- =====================================================

BEGIN;

-- Create missing table: _prisma_migrations
CREATE TABLE _prisma_migrations (
  id character NOT NULL,
  finished_at timestamp,
  migration_name character NOT NULL,
  logs text,
  rolled_back_at timestamp,
  started_at timestamp NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0
);

-- Add missing column: quick_sale_items.cost
ALTER TABLE quick_sale_items ADD COLUMN cost numeric(10;

-- Fix column type: activity_logs.entity_type
ALTER TABLE activity_logs ALTER COLUMN entity_type TYPE character;

-- Fix column type: activity_logs.action
ALTER TABLE activity_logs ALTER COLUMN action TYPE character;

-- Fix column type: activity_logs.created_at
ALTER TABLE activity_logs ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: carts.tax_rate
ALTER TABLE carts ALTER COLUMN tax_rate TYPE numeric(5;

-- Fix column type: carts.discount
ALTER TABLE carts ALTER COLUMN discount TYPE numeric(10;

-- Fix column type: carts.payment_method
ALTER TABLE carts ALTER COLUMN payment_method TYPE character;

-- Fix column type: carts.created_at
ALTER TABLE carts ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: carts.updated_at
ALTER TABLE carts ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: cash_flow_entries.type
ALTER TABLE cash_flow_entries ALTER COLUMN type TYPE character;

-- Fix column type: cash_flow_entries.category
ALTER TABLE cash_flow_entries ALTER COLUMN category TYPE character;

-- Fix column type: cash_flow_entries.amount
ALTER TABLE cash_flow_entries ALTER COLUMN amount TYPE numeric(10;

-- Fix column type: cash_flow_entries.entry_date
ALTER TABLE cash_flow_entries ALTER COLUMN entry_date TYPE timestamp(6);

-- Fix column type: cash_flow_entries.created_at
ALTER TABLE cash_flow_entries ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: cash_flow_entries.updated_at
ALTER TABLE cash_flow_entries ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: categories.name
ALTER TABLE categories ALTER COLUMN name TYPE character;

-- Fix column type: categories.subcategory
ALTER TABLE categories ALTER COLUMN subcategory TYPE character;

-- Fix column type: categories.brand
ALTER TABLE categories ALTER COLUMN brand TYPE character;

-- Fix column type: categories.created_at
ALTER TABLE categories ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: categories.icon
ALTER TABLE categories ALTER COLUMN icon TYPE character;

-- Fix column type: companies.name
ALTER TABLE companies ALTER COLUMN name TYPE character;

-- Fix column type: companies.city
ALTER TABLE companies ALTER COLUMN city TYPE character;

-- Fix column type: companies.state
ALTER TABLE companies ALTER COLUMN state TYPE character;

-- Fix column type: companies.pincode
ALTER TABLE companies ALTER COLUMN pincode TYPE character;

-- Fix column type: companies.phone
ALTER TABLE companies ALTER COLUMN phone TYPE character;

-- Fix column type: companies.email
ALTER TABLE companies ALTER COLUMN email TYPE character;

-- Fix column type: companies.gstin
ALTER TABLE companies ALTER COLUMN gstin TYPE character;

-- Fix column type: companies.website
ALTER TABLE companies ALTER COLUMN website TYPE character;

-- Fix column type: companies.created_at
ALTER TABLE companies ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: companies.updated_at
ALTER TABLE companies ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: companies.business_type
ALTER TABLE companies ALTER COLUMN business_type TYPE character;

-- Fix column type: customers.name
ALTER TABLE customers ALTER COLUMN name TYPE character;

-- Fix column type: customers.email
ALTER TABLE customers ALTER COLUMN email TYPE character;

-- Fix column type: customers.phone
ALTER TABLE customers ALTER COLUMN phone TYPE character;

-- Fix column type: customers.city
ALTER TABLE customers ALTER COLUMN city TYPE character;

-- Fix column type: customers.state
ALTER TABLE customers ALTER COLUMN state TYPE character;

-- Fix column type: customers.pincode
ALTER TABLE customers ALTER COLUMN pincode TYPE character;

-- Fix column type: customers.created_at
ALTER TABLE customers ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: customers.updated_at
ALTER TABLE customers ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: customers.customer_type
ALTER TABLE customers ALTER COLUMN customer_type TYPE character;

-- Fix column type: item_code_prefixes.prefix
ALTER TABLE item_code_prefixes ALTER COLUMN prefix TYPE character;

-- Fix column type: item_code_prefixes.description
ALTER TABLE item_code_prefixes ALTER COLUMN description TYPE character;

-- Fix column type: item_code_prefixes.created_at
ALTER TABLE item_code_prefixes ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: item_code_prefixes.updated_at
ALTER TABLE item_code_prefixes ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: items.name
ALTER TABLE items ALTER COLUMN name TYPE character;

-- Fix column type: items.code
ALTER TABLE items ALTER COLUMN code TYPE character;

-- Fix column type: items.barcode
ALTER TABLE items ALTER COLUMN barcode TYPE character;

-- Fix column type: items.subcategory
ALTER TABLE items ALTER COLUMN subcategory TYPE character;

-- Fix column type: items.cost
ALTER TABLE items ALTER COLUMN cost TYPE numeric(10;

-- Fix column type: items.price
ALTER TABLE items ALTER COLUMN price TYPE numeric(10;

-- Fix column type: items.mrp
ALTER TABLE items ALTER COLUMN mrp TYPE numeric(10;

-- Fix column type: items.created_at
ALTER TABLE items ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: items.display_name
ALTER TABLE items ALTER COLUMN display_name TYPE character;

-- Fix column type: items.mapping_code
ALTER TABLE items ALTER COLUMN mapping_code TYPE character;

-- Fix column type: permissions.customer_type
ALTER TABLE permissions ALTER COLUMN customer_type TYPE character;

-- Fix column type: permissions.page
ALTER TABLE permissions ALTER COLUMN page TYPE character;

-- Fix column type: permissions.created_at
ALTER TABLE permissions ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: permissions.updated_at
ALTER TABLE permissions ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: quick_sale_items.name
ALTER TABLE quick_sale_items ALTER COLUMN name TYPE character;

-- Fix column type: quick_sale_items.price
ALTER TABLE quick_sale_items ALTER COLUMN price TYPE numeric(10;

-- Fix column type: quick_sale_items.total_amount
ALTER TABLE quick_sale_items ALTER COLUMN total_amount TYPE numeric(10;

-- Fix column type: quick_sale_items.sold_at
ALTER TABLE quick_sale_items ALTER COLUMN sold_at TYPE timestamp(6);

-- Fix column type: quick_sale_items.created_at
ALTER TABLE quick_sale_items ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: quick_sale_items.updated_at
ALTER TABLE quick_sale_items ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: returns.return_type
ALTER TABLE returns ALTER COLUMN return_type TYPE character;

-- Fix column type: returns.status
ALTER TABLE returns ALTER COLUMN status TYPE character;

-- Fix column type: returns.refund_amount
ALTER TABLE returns ALTER COLUMN refund_amount TYPE numeric(10;

-- Fix column type: returns.approved_at
ALTER TABLE returns ALTER COLUMN approved_at TYPE timestamp(6);

-- Fix column type: returns.processed_at
ALTER TABLE returns ALTER COLUMN processed_at TYPE timestamp(6);

-- Fix column type: returns.created_at
ALTER TABLE returns ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: returns.updated_at
ALTER TABLE returns ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: sales_customers.name
ALTER TABLE sales_customers ALTER COLUMN name TYPE character;

-- Fix column type: sales_customers.mobile
ALTER TABLE sales_customers ALTER COLUMN mobile TYPE character;

-- Fix column type: sales_customers.email
ALTER TABLE sales_customers ALTER COLUMN email TYPE character;

-- Fix column type: sales_customers.place
ALTER TABLE sales_customers ALTER COLUMN place TYPE character;

-- Fix column type: sales_customers.created_at
ALTER TABLE sales_customers ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: sales_customers.updated_at
ALTER TABLE sales_customers ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: settings.item_log_actions
ALTER TABLE settings ALTER COLUMN item_log_actions TYPE character;

-- Fix column type: settings.receipt_header_option
ALTER TABLE settings ALTER COLUMN receipt_header_option TYPE character;

-- Fix column type: settings.created_at
ALTER TABLE settings ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: settings.updated_at
ALTER TABLE settings ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: settings.last_sync_at
ALTER TABLE settings ALTER COLUMN last_sync_at TYPE timestamp(6);

-- Fix column type: settings.last_sync_status
ALTER TABLE settings ALTER COLUMN last_sync_status TYPE character;

-- Fix column type: table_orders.status
ALTER TABLE table_orders ALTER COLUMN status TYPE character;

-- Fix column type: table_orders.tax_rate
ALTER TABLE table_orders ALTER COLUMN tax_rate TYPE numeric(5;

-- Fix column type: table_orders.discount
ALTER TABLE table_orders ALTER COLUMN discount TYPE numeric(10;

-- Fix column type: table_orders.total_amount
ALTER TABLE table_orders ALTER COLUMN total_amount TYPE numeric(10;

-- Fix column type: table_orders.payment_method
ALTER TABLE table_orders ALTER COLUMN payment_method TYPE character;

-- Fix column type: table_orders.created_at
ALTER TABLE table_orders ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: table_orders.updated_at
ALTER TABLE table_orders ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: tables.table_number
ALTER TABLE tables ALTER COLUMN table_number TYPE character;

-- Fix column type: tables.status
ALTER TABLE tables ALTER COLUMN status TYPE character;

-- Fix column type: tables.created_at
ALTER TABLE tables ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: tables.updated_at
ALTER TABLE tables ALTER COLUMN updated_at TYPE timestamp(6);

-- Fix column type: transactions.total_amount
ALTER TABLE transactions ALTER COLUMN total_amount TYPE numeric(10;

-- Fix column type: transactions.payment_method
ALTER TABLE transactions ALTER COLUMN payment_method TYPE character;

-- Fix column type: transactions.received_amount
ALTER TABLE transactions ALTER COLUMN received_amount TYPE numeric(10;

-- Fix column type: transactions.change_amount
ALTER TABLE transactions ALTER COLUMN change_amount TYPE numeric(10;

-- Fix column type: transactions.created_at
ALTER TABLE transactions ALTER COLUMN created_at TYPE timestamp(6);

-- Fix column type: transactions.edited_at
ALTER TABLE transactions ALTER COLUMN edited_at TYPE timestamp(6);

-- Fix column type: transactions.transaction_type
ALTER TABLE transactions ALTER COLUMN transaction_type TYPE character;


-- Commit changes
COMMIT;
