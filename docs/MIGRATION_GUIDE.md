# Database migration guide – add new changes without affecting existing data

Use this when you push new code (e.g. table orders, new tables, new columns) and want to **update the database without dropping existing tables or losing data**.

**Deploying to a client?** See **[DEPLOY_CLIENT.md](./DEPLOY_CLIENT.md)** for step-by-step instructions.

---

## 1. Two ways Prisma can change the DB

| Method | Command | Use case | Effect on existing data |
|--------|---------|----------|---------------------------|
| **Migrations** | `prisma migrate dev` / `prisma migrate deploy` | Production, team, versioned schema | **Safe** – only runs new migration SQL (adds tables/columns). Does **not** drop or reset. |
| **Db push** | `prisma db push` | Quick local prototyping only | **Risky** – can drop columns/tables if schema changed. Avoid for existing data. |

**Rule:** For any environment where you have real data, use **migrations** only. Use **db push** only on empty or throwaway DBs.

---

## 2. Commit migration files (one-time setup)

Migration SQL files **must be in git** so production and other devs can run the same migrations.

- **Remove** `backend/prisma/migrations/` from `.gitignore` (if it’s there) so the `prisma/migrations` folder is committed.
- After that, always commit new migration folders when you add schema changes.

---

## 3. Scenario A – You already use migrations (have `prisma/migrations/`)

If you already have a `backend/prisma/migrations/` folder and have been using `prisma migrate dev`:

### On your machine (dev)

```bash
cd backend

# 1. Backup DB first (recommended)
# e.g. use Export DB from the app, or: pg_dump -U postgres -d YOUR_DB > backup.sql

# 2. Create a new migration for your latest schema (table orders, new columns, etc.)
npx prisma migrate dev --name add_table_orders_and_latest

# 3. Prisma will:
#    - Compare schema.prisma with the DB
#    - Generate SQL that ONLY adds new tables/columns (does not drop existing data)
#    - Apply it and save the migration file under prisma/migrations/

# 4. Regenerate client
npm run prisma:generate
```

### Commit and push

- Commit the new folder under `backend/prisma/migrations/` (e.g. `20250129120000_add_table_orders_and_latest/`).
- Push so production (and others) get the new migration.

### On production / server (existing DB, no data loss)

```bash
cd backend

# Only applies pending migrations (new tables/columns). Does NOT reset or drop data.
npx prisma migrate deploy

npm run prisma:generate
# Restart your backend
```

---

## 4. Scenario B – Existing DB but no migrations yet (used `db push` or manual DB)

If your database already exists and has data, but you have **no** `prisma/migrations/` folder (e.g. you used `db push` before), you need to “baseline” once, then use migrations for all future changes.

### Step 1: Baseline (tell Prisma “current DB = initial state”)

```bash
cd backend

# 1. Create initial migration from current schema but DO NOT apply it (DB already has these tables)
npx prisma migrate dev --name init --create-only

# 2. Mark that migration as already applied (so Prisma doesn’t run it and try to create tables again)
npx prisma migrate resolve --applied init

# If the migration folder has a timestamped name like 20250129120000_init, use that name:
# npx prisma migrate resolve --applied 20250129120000_init
```

- **init** creates a migration that matches your **current** schema.
- **resolve --applied** marks it as “already applied” so Prisma won’t run it and won’t drop or recreate existing tables.

### Step 2: Add new changes (e.g. table orders)

- Update `schema.prisma` with your new models (Table, TableOrder, etc.) if not already there.
- Then:

```bash
cd backend

# Create migration for only the NEW parts
npx prisma migrate dev --name add_table_orders

# Commit the new migration folder and push
```

### Step 3: On production

```bash
cd backend
npx prisma migrate deploy
npm run prisma:generate
# Restart backend
```

---

## 5. Checklist before migrating on production

1. **Backup the database** (e.g. Export DB from app, or `pg_dump`).
2. **Review the new migration SQL**  
   - Open `backend/prisma/migrations/<timestamp>_<name>/migration.sql`.  
   - Confirm it only **adds** (CREATE TABLE, ADD COLUMN, CREATE INDEX) and does **not** DROP existing tables or columns you care about.
3. **Apply with deploy, not dev**  
   - On server: `npx prisma migrate deploy` (not `migrate dev`).
4. **Never say “yes” to “We need to reset the database”**  
   - If `migrate dev` asks to reset, answer **N**. Then fix schema or baseline (Scenario B) so no reset is needed.

---

## 6. Quick reference

| Goal | Command |
|------|--------|
| Create new migration (dev) | `cd backend && npx prisma migrate dev --name your_change_name` |
| Apply migrations only (production) | `cd backend && npx prisma migrate deploy` |
| Regenerate Prisma client | `cd backend && npm run prisma:generate` |
| Baseline existing DB (no migrations yet) | Create `init` migration with `--create-only`, then `prisma migrate resolve --applied <name>` |

Using migrations and the steps above, you can push your latest code (including table orders and other DB-related changes) and run **only the new migration SQL** on existing databases, so **existing tables and data are not affected**.
