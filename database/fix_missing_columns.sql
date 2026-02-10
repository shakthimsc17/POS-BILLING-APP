-- Add missing description column to item_code_prefixes table
-- This script handles the case where the table exists but column was deleted/missing
ALTER TABLE item_code_prefixes 
ADD COLUMN IF NOT EXISTS description VARCHAR(500);

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'item_code_prefixes' AND column_name = 'description';
