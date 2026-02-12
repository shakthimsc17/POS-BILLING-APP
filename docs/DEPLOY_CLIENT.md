# Deploy new changes to client

Use this when you deploy the latest code (including table orders, export DB, reports, etc.) to a client.

---

## What was generated for you

1. **Prisma migrations** (in `backend/prisma/migrations/`)  
   - All migrations up to `20260129120000_finalize_production_schema` represent the finalized schema.  
   - **On client:** run `npx prisma migrate deploy` so only **pending** migrations run. Existing tables and data are not dropped.

2. **Full schema SQL** (optional, for fresh DB only)  
   - `backend/prisma/scripts/deploy_full_schema.sql` – creates all tables from scratch.  
   - Use **only** when the client has an **empty** database (new install).  
   - Do **not** run this on a DB that already has data.

---

## Option A: Client already has the app (existing DB)

Use this when the client already has your app and a database with data.

1. **Backup the client DB** (e.g. Export DB from app, or `pg_dump`).

2. **Deploy your code** (e.g. git pull or copy files). Ensure `backend/prisma/migrations/` is included.

3. **On the client server:**
   ```bash
   cd backend

   # Apply only new migrations (adds new tables/columns; does not drop data)
   npx prisma migrate deploy

   # Regenerate Prisma client
   npm run prisma:generate

   # Restart backend
   ```

4. Restart the backend (and frontend if needed).

Existing tables and data stay as they are; only the new migration(s) are applied.

---

## Option B: New client (empty database)

Use this when the client is installing the app for the first time and has an empty PostgreSQL database.

### B1 – Using Prisma migrations (recommended)

1. **Set `DATABASE_URL`** in the client’s `backend/.env` to their empty DB.

2. **On the client server:**
   ```bash
   cd backend

   # Applies all migrations in order (creates all tables)
   npx prisma migrate deploy

   npm run prisma:generate

   # Optional: seed admin user
   npm run seed:admin
   ```

3. Start the backend and frontend.

### B2 – Using the full schema SQL (manual)

If the client prefers to run SQL manually (e.g. no Node on DB server):

1. Copy `backend/prisma/scripts/deploy_full_schema.sql` to the client.

2. Run it against their **empty** PostgreSQL database:
   ```bash
   psql -U postgres -d their_db_name -f deploy_full_schema.sql
   ```

3. **Mark all migrations as applied** so Prisma doesn’t try to run them again:
   ```bash
   cd backend
   npx prisma migrate resolve --applied 20260112145951_admin
   npx prisma migrate resolve --applied 20260113151726_company
   npx prisma migrate resolve --applied 20260127152538_add_table_management
   npx prisma migrate resolve --applied 20260127212106_add_display_name_to_items
   npx prisma migrate resolve --applied 20260127220000_add_receipt_auto_print
   npx prisma migrate resolve --applied 20260129120000_finalize_production_schema
   ```

4. Run `npm run prisma:generate` and start the app.

---

## Regenerating the full schema SQL (optional)

If you change `schema.prisma` and want to regenerate `deploy_full_schema.sql`:

```bash
cd backend
npm run prisma:generate-deploy-script
```

(Add this script to `package.json` – see below.)

---

## Summary

| Client situation | What to run |
|------------------|-------------|
| Existing DB with data | `npx prisma migrate deploy` in backend (Option A) |
| New / empty DB | `npx prisma migrate deploy` **or** run `prisma/scripts/deploy_full_schema.sql` then `migrate resolve` (Option B) |

The migration `20260129120000_finalize_production_schema` is a no-op (no SQL changes). It only marks the schema as finalized so that when you deploy to a client, `prisma migrate deploy` applies any pending migrations and leaves existing data unchanged.
