-- AlterTable
ALTER TABLE "items" ADD COLUMN     "mapping_code" VARCHAR(100);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "edited_at" TIMESTAMPTZ(6),
ADD COLUMN     "edited_by" UUID,
ADD COLUMN     "original_transaction_id" UUID,
ADD COLUMN     "transaction_type" VARCHAR(20) NOT NULL DEFAULT 'sale';

-- CreateTable
CREATE TABLE "returns" (
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

-- CreateIndex
CREATE INDEX "returns_customer_id_idx" ON "returns"("customer_id");

-- CreateIndex
CREATE INDEX "returns_original_transaction_id_idx" ON "returns"("original_transaction_id");

-- CreateIndex
CREATE INDEX "returns_status_idx" ON "returns"("status");

-- CreateIndex
CREATE INDEX "returns_return_type_idx" ON "returns"("return_type");

-- CreateIndex
CREATE INDEX "returns_created_at_idx" ON "returns"("created_at");

-- CreateIndex
CREATE INDEX "items_mapping_code_idx" ON "items"("mapping_code");

-- CreateIndex
CREATE INDEX "transactions_transaction_type_idx" ON "transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "transactions_original_transaction_id_idx" ON "transactions"("original_transaction_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_original_transaction_id_fkey" FOREIGN KEY ("original_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_original_transaction_id_fkey" FOREIGN KEY ("original_transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
