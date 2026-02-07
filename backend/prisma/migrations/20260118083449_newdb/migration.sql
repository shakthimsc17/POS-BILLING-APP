-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(20),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "gstin" VARCHAR(50),
    "website" VARCHAR(255),
    "logo" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_code_prefixes" (
    "id" UUID NOT NULL,
    "prefix" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_code_prefixes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_customer_id_key" ON "companies"("customer_id");

-- CreateIndex
CREATE INDEX "companies_customer_id_idx" ON "companies"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_code_prefixes_prefix_key" ON "item_code_prefixes"("prefix");

-- CreateIndex
CREATE INDEX "item_code_prefixes_prefix_idx" ON "item_code_prefixes"("prefix");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
