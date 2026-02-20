-- Ensure extension exists for UUID default
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Drop settings FK so we can re-add (idempotent)
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_customer_id_fkey";

-- Optional: companies Tamil columns (idempotent)
DO $$ BEGIN
  ALTER TABLE "companies" ADD COLUMN "address_tamil" VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "companies" ADD COLUMN "city_tamil" VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "companies" ADD COLUMN "name_tamil" VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "companies" ADD COLUMN "state_tamil" VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Re-add settings FK (idempotent)
DO $$ BEGIN
  ALTER TABLE "settings" ADD CONSTRAINT "settings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Optional: Rename transactions FK (idempotent)
DO $$ BEGIN
  ALTER TABLE "transactions" RENAME CONSTRAINT "transactions_sales_customer_id_fkey" TO "fk_transactions_sales_customer";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- CreateTable brands, suppliers, supplier_brands (idempotent)
CREATE TABLE IF NOT EXISTS "brands" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "description" TEXT,
    "logo_url" TEXT,
    "website" VARCHAR(255),
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "contact_person" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "mobile" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(20),
    "gstin" VARCHAR(50),
    "pan_number" VARCHAR(20),
    "payment_terms" VARCHAR(100),
    "credit_limit" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "supplier_brands" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "supplier_brand_code" VARCHAR(100),
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "brands_customer_name_unique" ON "brands"("customer_id", "name");
CREATE INDEX IF NOT EXISTS "brands_customer_id_idx" ON "brands"("customer_id");
CREATE INDEX IF NOT EXISTS "brands_code_idx" ON "brands"("code");
CREATE INDEX IF NOT EXISTS "brands_is_active_idx" ON "brands"("is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "suppliers_customer_name_unique" ON "suppliers"("customer_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "suppliers_customer_code_unique" ON "suppliers"("customer_id", "code");
CREATE INDEX IF NOT EXISTS "suppliers_customer_id_idx" ON "suppliers"("customer_id");
CREATE INDEX IF NOT EXISTS "suppliers_code_idx" ON "suppliers"("code");
CREATE INDEX IF NOT EXISTS "suppliers_is_active_idx" ON "suppliers"("is_active");
CREATE INDEX IF NOT EXISTS "suppliers_gstin_idx" ON "suppliers"("gstin");

CREATE UNIQUE INDEX IF NOT EXISTS "supplier_brands_customer_supplier_brand_unique" ON "supplier_brands"("customer_id", "supplier_id", "brand_id");
CREATE INDEX IF NOT EXISTS "supplier_brands_customer_id_idx" ON "supplier_brands"("customer_id");
CREATE INDEX IF NOT EXISTS "supplier_brands_supplier_id_idx" ON "supplier_brands"("supplier_id");
CREATE INDEX IF NOT EXISTS "supplier_brands_brand_id_idx" ON "supplier_brands"("brand_id");
CREATE INDEX IF NOT EXISTS "supplier_brands_is_preferred_idx" ON "supplier_brands"("is_preferred");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "brands" ADD CONSTRAINT "brands_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "supplier_brands" ADD CONSTRAINT "supplier_brands_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "supplier_brands" ADD CONSTRAINT "supplier_brands_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "supplier_brands" ADD CONSTRAINT "supplier_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Items: brand_id, supplier_id (idempotent)
DO $$ BEGIN
  ALTER TABLE "items" ADD COLUMN "brand_id" UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "items" ADD COLUMN "supplier_id" UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "items_brand_id_idx" ON "items"("brand_id");
CREATE INDEX IF NOT EXISTS "items_supplier_id_idx" ON "items"("supplier_id");
DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
