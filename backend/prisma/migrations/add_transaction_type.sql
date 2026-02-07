-- Migration: Add transaction_type column to transactions table
-- This migration adds the missing transaction_type column for returns functionality

-- Add the transaction_type column to transactions table
ALTER TABLE "transactions" 
ADD COLUMN "transaction_type" VARCHAR(20) DEFAULT 'sale';

-- Create index for transaction_type for better query performance
CREATE INDEX "transactions_transaction_type_idx" ON "transactions"("transaction_type");

-- Set default value for existing rows (optional - can be 'sale')
UPDATE "transactions" 
SET "transaction_type" = 'sale' 
WHERE "transaction_type" IS NULL;
