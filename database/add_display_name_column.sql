-- Add display_name column to items table if it doesn't exist
ALTER TABLE items ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
