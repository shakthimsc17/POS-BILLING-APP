-- Add Tamil company name field to companies table
-- Migration: 20250215_add_tamil_company_name.sql

ALTER TABLE companies 
ADD COLUMN name_tamil VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN companies.name_tamil IS 'Tamil translation of company name for bilingual receipts';
