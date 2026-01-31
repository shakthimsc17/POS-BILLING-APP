-- Add mapping_code column to items table if it doesn't exist
ALTER TABLE items ADD COLUMN IF NOT EXISTS mapping_code VARCHAR(100);

-- Create index on mapping_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_items_mapping_code ON items(mapping_code);
