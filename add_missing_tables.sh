#!/bin/bash

# Script to add missing tables to existing database
# Safe to run - won't delete existing data

echo "=========================================="
echo "Adding Missing Tables and Columns"
echo "=========================================="
echo ""

# Database connection details
DB_NAME="possystem"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "Step 1: Adding missing tables and columns..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f database/add_missing_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Missing tables and columns added successfully"
else
    echo "❌ Error adding tables/columns"
    exit 1
fi

echo ""
echo "Step 2: Generating Prisma client..."
cd backend
npm run prisma:generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Error generating Prisma client"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Missing tables added successfully!"
echo "=========================================="
echo ""
echo "Added tables:"
echo "  - item_code_prefixes"
echo "  - sales_customers"
echo "  - quick_sale_items"
echo "  - cash_flow_entries"
echo "  - permissions"
echo "  - carts"
echo "  - tables"
echo "  - table_orders"
