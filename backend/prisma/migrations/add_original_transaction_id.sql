-- Migration: Add original_transaction_id column to transactions table
-- This migration adds the missing original_transaction_id column for returns functionality

-- Add the original_transaction_id column to transactions table
ALTER TABLE "transactions" 
ADD COLUMN "original_transaction_id" UUID;

-- Create index for original_transaction_id for better query performance
CREATE INDEX "transactions_original_transaction_id_idx" ON "transactions"("original_transaction_id");

-- Set default value for existing rows (optional - can be NULL)
UPDATE "transactions" 
SET "original_transaction_id" = NULL 
WHERE "original_transaction_id" IS NULL;
