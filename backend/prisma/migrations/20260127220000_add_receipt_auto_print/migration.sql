-- AlterTable (idempotent)
DO $$ BEGIN
  ALTER TABLE "settings" ADD COLUMN "receipt_auto_print" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
