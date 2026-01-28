#!/bin/bash

# Script to restore database schema after reset
# Run this in your current system

echo "=========================================="
echo "Database Schema Restoration Script"
echo "=========================================="
echo ""

# Database connection details
DB_NAME="possystem"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Check if database exists
echo "Step 1: Checking database connection..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to database"
    echo "Please check your PostgreSQL connection settings"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Restore schema
echo "Step 2: Restoring database schema..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f database/init.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema restored successfully"
else
    echo "❌ Error restoring schema"
    exit 1
fi

echo ""
echo "Step 3: Generating Prisma client..."
cd backend
npm run prisma:generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Error generating Prisma client"
    exit 1
fi

echo ""
echo "Step 4: Creating admin account..."
npm run seed:admin

if [ $? -eq 0 ]; then
    echo "✅ Admin account created"
else
    echo "⚠️  Warning: Admin account creation failed (may already exist)"
fi

echo ""
echo "=========================================="
echo "✅ Schema restoration complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Login with admin credentials"
