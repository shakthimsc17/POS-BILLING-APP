# Admin Account Setup Guide

## Overview
This guide explains how to set up the default admin account and run database migrations for the admin feature.

## Database Migration

1. **Run Prisma Migration** to add the `isAdmin` field to the customers table:
   ```bash
   cd backend
   npm run prisma:migrate
   ```
   
   Or if you prefer to push the schema directly:
   ```bash
   npm run prisma:push
   ```

2. **Generate Prisma Client** (if needed):
   ```bash
   npm run prisma:generate
   ```

## Create Default Admin Account

Run the seed script to create the default admin account:

```bash
cd backend
npm run seed:admin
```

### Default Admin Credentials

- **Email**: `admin@posbilling.com` (or set `ADMIN_EMAIL` env variable)
- **Password**: `admin123` (or set `ADMIN_PASSWORD` env variable)
- **Name**: `Admin` (or set `ADMIN_NAME` env variable)

### Custom Admin Credentials

You can set custom credentials using environment variables:

```bash
export ADMIN_EMAIL=your-admin@email.com
export ADMIN_PASSWORD=your-secure-password
export ADMIN_NAME=Your Admin Name
npm run seed:admin
```

## Features

### Admin-Only Features
- **Reports Page**: Only visible to admin users
- **Profit Details**: Only shown to admin users in Sales page
- **Full Analytics**: Complete business insights available only to admins

### Regular User Features
- Can access all other features (Dashboard, Cart, Items, Categories, Sales, etc.)
- Cannot see profit/loss information
- Cannot access Reports page

## Verification

After setup, you can verify the admin account by:
1. Signing in with the admin credentials
2. Checking that the Reports link appears in the sidebar
3. Verifying profit details are visible in the Sales page

## Notes

- The admin account will be created if it doesn't exist
- If an admin account with the same email exists, it will be updated to ensure `isAdmin` is set to `true`
- Regular users created through signup will have `isAdmin: false` by default

