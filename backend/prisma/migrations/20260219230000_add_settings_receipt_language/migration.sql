-- Add receipt_language to settings if missing (idempotent)
DO $$ BEGIN
  ALTER TABLE "settings" ADD COLUMN "receipt_language" VARCHAR(10) DEFAULT 'en';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
