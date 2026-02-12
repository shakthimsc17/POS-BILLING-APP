---
description: Deploy database migrations to the client system
---

# Deploying Database Changes

You can safely migrate the client's existing database to include the new tables and columns using Prisma Migrate. Prisma will check which migrations have already been applied and apply only the new ones.

## 1. Prepare the Migration Files (Already Done)

We have already consolidated the schema changes into new migration files.
You can find them in `backend/prisma/migrations`.

## 2. Deploy to Client System

On the client's machine (Production), run the following command in the `backend` directory:

```bash
npx prisma migrate deploy
```

**What this does:**
1.  Connects to the client's existing database.
2.  Checks the `_prisma_migrations` table to see which migrations are already applied.
3.  Applies any **new** pending migrations (e.g., adding the `returns` table, adding `payment_method` to `table_orders`, etc.).
4.  Updates the schema without losing existing data (tables are altered, not dropped, unless specified otherwise).

## 3. Verify Migration (Optional)

You can verify the status of the migrations on the client machine:

```bash
npx prisma migrate status
```

It should say "Database schema is up to date".
