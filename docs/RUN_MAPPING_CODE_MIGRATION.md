# Safe Migration Guide: Adding mapping_code Column

This guide shows how to safely add the `mapping_code` column to your items table **without losing any data**.

## ✅ Why This Migration is Safe

The migration script uses:
- `ADD COLUMN IF NOT EXISTS` - Only adds the column if it doesn't exist
- `CREATE INDEX IF NOT EXISTS` - Only creates index if it doesn't exist
- **No data is deleted or modified**
- **Existing data remains intact**

## Step 1: Create Database Backup (Recommended)

**Always backup before running migrations on production!**

```bash
# Create a backup of your database
pg_dump -U postgres -d possystem > backup_before_mapping_code_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_before_mapping_code_*.sql
```

**Keep this backup safe!** You can restore it if anything goes wrong.

## Step 2: Run the Migration

### Option A: Using psql Command Line (Recommended)

```bash
# Navigate to project root
cd /var/www/html/database/POSBILLING/POS-BILLING-APP

# Run the migration script
psql -U postgres -d possystem -f database/add_mapping_code_column.sql
```

If you need to specify host/port:
```bash
psql -h localhost -p 5432 -U postgres -d possystem -f database/add_mapping_code_column.sql
```

### Option B: Using psql Interactive Mode

```bash
# Connect to PostgreSQL
psql -U postgres -d possystem

# Then run:
\i database/add_mapping_code_column.sql

# Or copy-paste the SQL directly:
ALTER TABLE items ADD COLUMN IF NOT EXISTS mapping_code VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_items_mapping_code ON items(mapping_code);

# Exit psql
\q
```

### Option C: Using Prisma (Alternative)

If you prefer using Prisma migrations:

```bash
cd backend

# Generate Prisma client (updates types)
npm run prisma:generate

# Push schema changes (adds column)
npm run prisma:push
```

**Note:** `prisma:push` will add the column, but won't create the index. You'll need to run the SQL for the index separately.

## Step 3: Verify the Migration

Check that the column was added successfully:

```bash
# Connect to database
psql -U postgres -d possystem

# Check if column exists
\d items

# Or run this query:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'mapping_code';

# Check if index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'items' AND indexname = 'idx_items_mapping_code';

# Exit
\q
```

You should see:
- Column `mapping_code` with type `character varying(100)`
- Index `idx_items_mapping_code`

## Step 4: Update Prisma Client

After the migration, regenerate Prisma client:

```bash
cd backend
npm run prisma:generate
```

## Step 5: Verify Data Integrity

Check that all existing items still have their data:

```bash
psql -U postgres -d possystem

# Count total items
SELECT COUNT(*) FROM items;

# Check a few sample items
SELECT id, name, code, mapping_code FROM items LIMIT 5;

# All items should have NULL mapping_code (which is expected)
```

## Troubleshooting

### Error: "column already exists"
This means the column was already added. The migration is safe to run multiple times.

### Error: "permission denied"
You may need to run as postgres superuser:
```bash
sudo -u postgres psql -d possystem -f database/add_mapping_code_column.sql
```

### Error: "database does not exist"
Check your database name:
```bash
psql -U postgres -l
```

### Verify Connection
Test your connection first:
```bash
psql -U postgres -d possystem -c "SELECT version();"
```

## What Happens to Existing Data?

- ✅ **All existing items remain unchanged**
- ✅ **All existing data is preserved**
- ✅ **New column is added with NULL values (which is expected)**
- ✅ **You can set mapping_code values later through the UI**

## After Migration

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. The new `mapping_code` field will be available in:
   - Items management page
   - Quick Item Sales page
   - Quick Item Search (for Cafe business type)

3. You can now set mapping codes for your items through the Items page.

## Rollback (If Needed)

If you need to remove the column (not recommended):

```sql
-- WARNING: This will delete the mapping_code data!
-- Only run if absolutely necessary

ALTER TABLE items DROP COLUMN IF EXISTS mapping_code;
DROP INDEX IF EXISTS idx_items_mapping_code;
```

## Summary

✅ **Safe to run** - No data loss  
✅ **Idempotent** - Can run multiple times safely  
✅ **Non-destructive** - Only adds new column  
✅ **Quick** - Takes seconds to complete  

The migration is designed to be completely safe and can be run on production systems without any downtime or data loss.
