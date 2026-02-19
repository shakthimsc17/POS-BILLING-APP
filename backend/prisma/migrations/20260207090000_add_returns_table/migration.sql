-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "returns" (
    "id" UUID NOT NULL,
    "original_transaction_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "return_type" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "refund_amount" DECIMAL(10,2),
    "restocked_items" JSONB,
    "exchange_items" JSONB,
    "notes" TEXT,
    "approved_by" UUID,
    "processed_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "returns_customer_id_idx" ON "returns"("customer_id");
CREATE INDEX IF NOT EXISTS "returns_original_transaction_id_idx" ON "returns"("original_transaction_id");
CREATE INDEX IF NOT EXISTS "returns_status_idx" ON "returns"("status");
CREATE INDEX IF NOT EXISTS "returns_return_type_idx" ON "returns"("return_type");
CREATE INDEX IF NOT EXISTS "returns_created_at_idx" ON "returns"("created_at");

DO $$ BEGIN ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "returns" ADD CONSTRAINT "returns_original_transaction_id_fkey" FOREIGN KEY ("original_transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "returns" ADD CONSTRAINT "returns_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "returns" ADD CONSTRAINT "returns_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
