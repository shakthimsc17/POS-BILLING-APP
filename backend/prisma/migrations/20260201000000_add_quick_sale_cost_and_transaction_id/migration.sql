-- AlterTable
ALTER TABLE "quick_sale_items" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "transaction_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "quick_sale_items_transaction_id_idx" ON "quick_sale_items"("transaction_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quick_sale_items_transaction_id_fkey'
    AND table_name = 'quick_sale_items'
  ) THEN
    ALTER TABLE "quick_sale_items" ADD CONSTRAINT "quick_sale_items_transaction_id_fkey"
      FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
