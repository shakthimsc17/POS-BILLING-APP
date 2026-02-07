-- Migration: Add compound unique constraint to tables table
-- This migration adds unique constraint on (customer_id, table_number) to prevent duplicate table numbers per customer

-- Add unique constraint to tables table
ALTER TABLE "tables" 
ADD CONSTRAINT "tables_customer_id_table_number_key" UNIQUE ("customer_id", "table_number");
