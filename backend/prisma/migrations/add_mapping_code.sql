-- Migration: Add mapping_code column to items table
-- This migration adds the missing mapping_code column without affecting existing data

-- Add the mapping_code column to items table
ALTER TABLE "items" 
ADD COLUMN "mapping_code" VARCHAR(100);

-- Create index for mapping_code for better search performance
CREATE INDEX "items_mapping_code_idx" ON "items"("mapping_code");

-- Set default value for existing rows (optional - can be NULL)
UPDATE "items" 
SET "mapping_code" = NULL 
WHERE "mapping_code" IS NULL;
