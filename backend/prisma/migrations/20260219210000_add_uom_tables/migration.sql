-- CreateTable uom_master (idempotent)
CREATE TABLE IF NOT EXISTS "uom_master" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "base_uom_id" UUID,
    "conversion_factor" DECIMAL(10,6) DEFAULT 1.0,
    "is_base_uom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uom_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable uom_conversions (idempotent)
CREATE TABLE IF NOT EXISTS "uom_conversions" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "from_uom_id" UUID NOT NULL,
    "to_uom_id" UUID NOT NULL,
    "conversion_factor" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uom_conversions_pkey" PRIMARY KEY ("id")
);

-- Add uom_id to items (idempotent)
DO $$ BEGIN
  ALTER TABLE "items" ADD COLUMN "uom_id" UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Indexes for uom_master
CREATE INDEX IF NOT EXISTS "uom_master_customer_id_idx" ON "uom_master"("customer_id");

-- Unique and indexes for uom_conversions
CREATE UNIQUE INDEX IF NOT EXISTS "uom_conversions_customer_from_to_unique" ON "uom_conversions"("customer_id", "from_uom_id", "to_uom_id");
CREATE INDEX IF NOT EXISTS "uom_conversions_customer_id_idx" ON "uom_conversions"("customer_id");

-- Index for items.uom_id
CREATE INDEX IF NOT EXISTS "items_uom_id_idx" ON "items"("uom_id");

-- Foreign keys (idempotent)
DO $$ BEGIN
  ALTER TABLE "uom_master" ADD CONSTRAINT "uom_master_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "uom_master" ADD CONSTRAINT "uom_master_base_uom_id_fkey" FOREIGN KEY ("base_uom_id") REFERENCES "uom_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_from_uom_id_fkey" FOREIGN KEY ("from_uom_id") REFERENCES "uom_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_to_uom_id_fkey" FOREIGN KEY ("to_uom_id") REFERENCES "uom_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uom_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
