#!/bin/bash

# Script to add display_name column to items table
# Run this if you have PostgreSQL authentication issues

echo "Adding display_name column to items table..."

# Database connection details - adjust as needed
DB_NAME="possystem"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Try to add the column
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "ALTER TABLE items ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);"

if [ $? -eq 0 ]; then
    echo "✅ display_name column added successfully"
    echo ""
    echo "Regenerating Prisma client..."
    cd backend
    npm run prisma:generate
else
    echo "❌ Error adding column"
    echo ""
    echo "Please run this SQL manually:"
    echo "ALTER TABLE items ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);"
    exit 1
fi
