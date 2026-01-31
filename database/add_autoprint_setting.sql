-- Add receipt_auto_print column to settings table if it doesn't exist
ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_auto_print BOOLEAN DEFAULT true;

-- Update existing settings to have auto_print enabled by default
UPDATE settings SET receipt_auto_print = true WHERE receipt_auto_print IS NULL;
