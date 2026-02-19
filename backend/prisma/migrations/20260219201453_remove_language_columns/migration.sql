-- Remove language-related columns from companies table
ALTER TABLE "companies" DROP COLUMN IF EXISTS "default_language";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "receipt_language";

-- Remove language_settings column from settings table
ALTER TABLE "settings" DROP COLUMN IF EXISTS "language_settings";
