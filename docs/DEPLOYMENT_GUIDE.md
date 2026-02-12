# Safe Deployment Guide - Table Management Feature

This guide shows how to safely apply the new table management feature to your system and client systems without losing data.

## Part 1: Restore Your Current System (After Reset)

Since your database was reset, follow these steps to recreate all tables:

### Step 1: Restore Complete Schema

```bash
cd /var/www/html/database/POSBILLING/POS-BILLING-APP

# Connect to PostgreSQL and run the complete init script
psql -U postgres -d possystem -f database/init.sql
```

### Step 2: Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### Step 3: Recreate Admin Account

```bash
cd backend
npm run seed:admin
```

### Step 4: Verify Everything Works

```bash
# Start backend
cd backend
npm run dev

# In another terminal, start frontend
cd frontend
npm run dev
```

---

## Part 2: Safe Deployment to Client System (WITHOUT Data Loss)

**IMPORTANT**: Follow these steps carefully to avoid losing client data!

### Pre-Deployment Checklist

- [ ] Create database backup
- [ ] Test on a staging/test database first (if available)
- [ ] Ensure you have access to restore backup if needed

### Step 1: Create Database Backup (CRITICAL!)

```bash
# Connect to client database and create backup
pg_dump -U postgres -d possystem > backup_before_table_management_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_before_table_management_*.sql
```

**Keep this backup safe!** You'll need it if anything goes wrong.

### Step 2: Copy Updated Files to Client System

Copy these files to the client system:

```bash
# From your development system, copy:
- backend/prisma/schema.prisma
- backend/src/routes/tables.ts
- backend/src/routes/tableOrders.ts
- backend/src/index.ts (updated with new routes)
- frontend/src/components/BarcodeInput.tsx
- frontend/src/components/BarcodeInput.css
- frontend/src/pages/Tables.tsx
- frontend/src/pages/Tables.css
- frontend/src/pages/TableOrders.tsx
- frontend/src/pages/TableOrders.css
- frontend/src/store/tableStore.ts
- frontend/src/types/index.ts (updated)
- frontend/src/services/storage.ts (updated)
- frontend/src/pages/Dashboard.tsx (updated)
- frontend/src/pages/Cart.tsx (updated)
- frontend/src/App.tsx (updated)
- frontend/src/store/cartStore.ts (updated)
- frontend/src/utils/printer.ts (updated)
- backend/src/routes/items.ts (updated with barcode search)
```

### Step 3: Install Dependencies (if needed)

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 4: Create Migration (SAFE - No Data Loss)

**This is the SAFE way - it only adds new tables, doesn't modify existing ones:**

```bash
cd backend

# Create migration file (doesn't apply yet)
npx prisma migrate dev --name add_table_management --create-only
```

This creates a migration file in `backend/prisma/migrations/` that you can review.

### Step 5: Review Migration File

Check the generated migration file:
```bash
cat backend/prisma/migrations/*/migration.sql | grep -A 5 "CREATE TABLE"
```

**Verify it only:**
- ✅ Creates `tables` table
- ✅ Creates `table_orders` table
- ✅ Adds indexes
- ✅ Adds foreign keys
- ❌ Does NOT drop or modify existing tables
- ❌ Does NOT delete any data

### Step 6: Apply Migration (SAFE)

If the migration looks correct, apply it:

```bash
cd backend

# Apply the migration
npx prisma migrate deploy

# OR if using dev environment:
npx prisma migrate dev
```

**When prompted:**
```
? We need to reset the "public" schema
Do you want to continue? All data will be lost. › (y/N)
```

**ALWAYS answer: N (No)**

If you see this prompt, it means Prisma detected a conflict. In that case:
1. Answer **N**
2. Check what's different
3. Manually create only the new tables using SQL (see Step 7 alternative)

### Step 7: Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### Step 8: Restart Services

```bash
# Restart backend
cd backend
# Stop current process (Ctrl+C)
npm run dev

# Restart frontend
cd frontend
# Stop current process (Ctrl+C)
npm run dev
```

---

## Alternative: Manual SQL Approach (Safest for Production)

If you want maximum safety, apply only the new tables manually:

### Step 1: Connect to Database

```bash
psql -U postgres -d possystem
```

### Step 2: Run Only New Table Creation SQL

```sql
-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  capacity INTEGER DEFAULT 4 NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  CONSTRAINT uq_tables_customer_table_number UNIQUE (customer_id, table_number)
);

-- Create indexes for tables
CREATE INDEX IF NOT EXISTS idx_tables_customer_id ON tables(customer_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- Create table_orders table
CREATE TABLE IF NOT EXISTS table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  items_json TEXT NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_amount DECIMAL(10, 2),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi')),
  transaction_id UUID UNIQUE REFERENCES transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create indexes for table_orders
CREATE INDEX IF NOT EXISTS idx_table_orders_customer_id ON table_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_table_id ON table_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON table_orders(status);
CREATE INDEX IF NOT EXISTS idx_table_orders_created_at ON table_orders(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_table_orders_updated_at
  BEFORE UPDATE ON table_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Update Prisma Migration History

After manually creating tables, mark migration as applied:

```bash
cd backend

# Create migration record (without applying)
npx prisma migrate resolve --applied add_table_management

# Generate Prisma client
npm run prisma:generate
```

---

## Verification Steps

After deployment, verify:

1. **Check tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('tables', 'table_orders');
   ```

2. **Check existing data is intact:**
   ```sql
   SELECT COUNT(*) FROM customers;
   SELECT COUNT(*) FROM items;
   SELECT COUNT(*) FROM transactions;
   ```

3. **Test new features:**
   - Barcode scanning works
   - Tables page appears (for cafe business type)
   - Table orders can be created
   - Auto-print works on payment

---

## Rollback Plan (If Something Goes Wrong)

If you need to rollback:

```bash
# Restore from backup
psql -U postgres -d possystem < backup_before_table_management_YYYYMMDD_HHMMSS.sql

# Revert code changes (git checkout previous commit)
git checkout <previous-commit-hash>
```

---

## Summary: Safe Deployment Steps

**For Client System (Production):**

1. ✅ **Backup database first** (CRITICAL!)
2. ✅ Copy updated code files
3. ✅ Run: `npx prisma migrate dev --name add_table_management`
4. ✅ **Answer "N" to any reset prompts**
5. ✅ Run: `npm run prisma:generate`
6. ✅ Restart services
7. ✅ Verify existing data is intact
8. ✅ Test new features

**Key Rule**: **NEVER answer "Y" to database reset prompts in production!**
