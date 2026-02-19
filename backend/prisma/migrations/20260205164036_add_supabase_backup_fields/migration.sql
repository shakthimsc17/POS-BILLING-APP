-- AlterTable (idempotent)
DO $$ BEGIN ALTER TABLE "settings" ADD COLUMN "last_sync_at" TIMESTAMPTZ(6);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "settings" ADD COLUMN "last_sync_status" VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "settings" ADD COLUMN "supabase_url" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
