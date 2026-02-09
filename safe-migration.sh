#!/bin/bash

# =====================================================
# Safe Database Migration Script
# For POS Billing Application Deployment
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./database/backups"
MIGRATION_DIR="./database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="pre_migration_${TIMESTAMP}.sql"

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}POS Billing System - Safe Migration Script${NC}"
echo -e "${BLUE}====================================================${NC}"
echo

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ psql command not found. Please install PostgreSQL client.${NC}"
        exit 1
    fi
    
    # Test database connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        echo -e "${RED}❌ Cannot connect to database. Please check connection parameters.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ PostgreSQL connection verified${NC}"
}

# Function to create database backup
create_backup() {
    echo -e "${YELLOW}Creating database backup...${NC}"
    
    local backup_path="$BACKUP_DIR/$BACKUP_FILE"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --clean --if-exists --no-owner --no-privileges > "$backup_path"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created: $backup_path${NC}"
        echo "$backup_path" > "$BACKUP_DIR/last_backup.txt"
    else
        echo -e "${RED}❌ Backup creation failed${NC}"
        exit 1
    fi
}

# Function to run schema comparison
run_schema_comparison() {
    echo -e "${YELLOW}Running schema comparison...${NC}"
    
    cd backend
    node scripts/schema-comparator.js
    cd ..
}

# Function to apply specific migration for mapping_code
apply_mapping_code_migration() {
    echo -e "${YELLOW}Applying mapping_code migration...${NC}"
    
    # Check if mapping_code column exists
    local column_exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mapping_code');" | tr -d ' ')
    
    if [ "$column_exists" = "t" ]; then
        echo -e "${GREEN}✅ mapping_code column already exists${NC}"
    else
        echo -e "${YELLOW}Adding mapping_code column...${NC}"
        
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            ALTER TABLE items ADD COLUMN IF NOT EXISTS mapping_code VARCHAR(100);
            CREATE INDEX IF NOT EXISTS idx_items_mapping_code ON items(mapping_code);
        "
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ mapping_code column added successfully${NC}"
        else
            echo -e "${RED}❌ Failed to add mapping_code column${NC}"
            return 1
        fi
    fi
}

# Function to apply all missing migrations
apply_all_migrations() {
    echo -e "${YELLOW}Applying all missing migrations...${NC}"
    
    # Apply individual migration scripts in order
    local migrations=(
        "add_display_name_column.sql"
        "add_mapping_code_column.sql"
        "add_autoprint_setting.sql"
        "add_missing_tables.sql"
        "fix_missing_columns.sql"
    )
    
    for migration in "${migrations[@]}"; do
        local migration_path="$MIGRATION_DIR/$migration"
        
        if [ -f "$migration_path" ]; then
            echo -e "${YELLOW}Applying $migration...${NC}"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_path"
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ $migration applied successfully${NC}"
            else
                echo -e "${RED}❌ Failed to apply $migration${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  Migration file $migration not found, skipping${NC}"
        fi
    done
}

# Function to validate post-migration state
validate_migration() {
    echo -e "${YELLOW}Validating post-migration state...${NC}"
    
    # Check critical tables
    local critical_tables=("customers" "items" "categories" "transactions")
    local validation_failed=false
    
    for table in "${critical_tables[@]}"; do
        local table_exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');" | tr -d ' ')
        
        if [ "$table_exists" = "t" ]; then
            echo -e "${GREEN}✅ Table $table exists${NC}"
        else
            echo -e "${RED}❌ Table $table missing${NC}"
            validation_failed=true
        fi
    done
    
    # Check mapping_code column specifically
    local mapping_code_exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mapping_code');" | tr -d ' ')
    
    if [ "$mapping_code_exists" = "t" ]; then
        echo -e "${GREEN}✅ mapping_code column exists in items table${NC}"
    else
        echo -e "${RED}❌ mapping_code column missing from items table${NC}"
        validation_failed=true
    fi
    
    if [ "$validation_failed" = true ]; then
        echo -e "${RED}❌ Post-migration validation failed${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Post-migration validation passed${NC}"
    fi
}

# Function to rollback from backup
rollback() {
    echo -e "${YELLOW}Rolling back from backup...${NC}"
    
    if [ ! -f "$BACKUP_DIR/last_backup.txt" ]; then
        echo -e "${RED}❌ No backup file found for rollback${NC}"
        exit 1
    fi
    
    local backup_file=$(cat "$BACKUP_DIR/last_backup.txt")
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restoring from backup: $backup_file${NC}"
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Rollback completed successfully${NC}"
    else
        echo -e "${RED}❌ Rollback failed${NC}"
        exit 1
    fi
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --check-only         Only check database connection and schema"
    echo "  --backup-only        Only create backup, don't migrate"
    echo "  --mapping-code-only  Apply only mapping_code migration"
    echo "  --all-migrations     Apply all missing migrations"
    echo "  --rollback           Rollback from last backup"
    echo "  --dry-run            Show what would be done without executing"
    echo
    echo "Environment Variables:"
    echo "  DB_HOST              Database host (default: localhost)"
    echo "  DB_PORT              Database port (default: 5432)"
    echo "  DB_NAME              Database name"
    echo "  DB_USER              Database user"
    echo "  DB_PASSWORD          Database password"
    echo
    echo "Examples:"
    echo "  $0 --all-migrations"
    echo "  $0 --mapping-code-only"
    echo "  $0 --rollback"
}

# Main execution
main() {
    # Load environment variables from .env file if it exists
    if [ -f "backend/.env" ]; then
        echo -e "${YELLOW}Loading environment variables from backend/.env${NC}"
        set -a
        source backend/.env
        set +a
    fi

    # Set defaults
    export DB_HOST=${DB_HOST:-localhost}
    export DB_PORT=${DB_PORT:-5432}
    
    # Check required environment variables
    if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}❌ Required environment variables not set: DB_NAME, DB_USER, DB_PASSWORD${NC}"
        usage
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-}" in
        --check-only)
            check_postgres
            run_schema_comparison
            exit 0
            ;;
        --backup-only)
            check_postgres
            create_backup
            exit 0
            ;;
        --mapping-code-only)
            check_postgres
            create_backup
            apply_mapping_code_migration
            validate_migration
            exit 0
            ;;
        --all-migrations)
            check_postgres
            create_backup
            apply_all_migrations
            validate_migration
            exit 0
            ;;
        --rollback)
            rollback
            exit 0
            ;;
        --dry-run)
            echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
            check_postgres
            run_schema_comparison
            exit 0
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        "")
            # Default behavior - run full migration
            check_postgres
            create_backup
            run_schema_comparison
            apply_mapping_code_migration
            apply_all_migrations
            validate_migration
            echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
            echo -e "${BLUE}Backup available at: $BACKUP_DIR/$BACKUP_FILE${NC}"
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
}

# Trap errors and cleanup
trap 'echo -e "${RED}❌ Script failed. Check logs above.${NC}"' ERR

# Run main function
main "$@"
