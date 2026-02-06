-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "last_sync_at" TIMESTAMPTZ(6),
ADD COLUMN     "last_sync_status" VARCHAR(50),
ADD COLUMN     "supabase_url" TEXT;
