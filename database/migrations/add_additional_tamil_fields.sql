-- Add additional Tamil translation fields to companies table
-- Migration: 20250215_add_additional_tamil_fields.sql

ALTER TABLE companies 
ADD COLUMN address_tamil VARCHAR(255),
ADD COLUMN city_tamil VARCHAR(100),
ADD COLUMN state_tamil VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN companies.address_tamil IS 'Tamil translation of company address for bilingual receipts';
COMMENT ON COLUMN companies.city_tamil IS 'Tamil translation of company city for bilingual receipts';
COMMENT ON COLUMN companies.state_tamil IS 'Tamil translation of company state for bilingual receipts';
