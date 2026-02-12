# Database Schema Migration Guide

## Overview

This guide provides a comprehensive approach to safely migrate existing client databases to the latest schema, addressing the mapping_code field issue and preventing similar deployment failures.

## Problem Analysis

### Root Cause
- **Prisma Schema**: Uses `mappingCode` (camelCase) with `@map("mapping_code")` annotation
- **Frontend**: Sends `mappingCode` field in requests
- **Existing Databases**: Missing `mapping_code` column entirely
- **Result**: Runtime errors when trying to save mapping_code values

### Schema Inconsistencies Found
1. Missing columns in existing client databases
2. Field naming mismatches (camelCase vs snake_case)
3. Missing tables in older installations
4. Data type differences across versions

## Solution Architecture

### 1. Schema Comparison System
- **File**: `backend/scripts/schema-comparator.js`
- **Purpose**: Compare existing database against reference schema
- **Features**:
  - Identify missing tables and columns
  - Detect type mismatches
  - Generate migration scripts automatically
  - Severity-based issue classification

### 2. Safe Migration Executor
- **File**: `backend/scripts/migration-executor.js`
- **Purpose**: Execute migrations with safety measures
- **Features**:
  - Automatic backup creation
  - Migration script validation
  - Rollback capabilities
  - Post-migration validation

### 3. Automated Migration Script
- **File**: `safe-migration.sh`
- **Purpose**: One-command migration with multiple options
- **Features**:
  - Environment-based configuration
  - Multiple migration modes
  - Error handling and recovery
  - Comprehensive logging

## Migration Strategies

### Strategy 1: Schema Comparison First
```bash
# Check what needs to be migrated
./safe-migration.sh --check-only
```

### Strategy 2: Targeted mapping_code Fix
```bash
# Fix only the mapping_code issue
./safe-migration.sh --mapping-code-only
```

### Strategy 3: Complete Migration
```bash
# Apply all missing migrations
./safe-migration.sh --all-migrations
```

### Strategy 4: Dry Run Testing
```bash
# Preview changes without executing
./safe-migration.sh --dry-run
```

## Environment Setup

### Required Environment Variables
```bash
export DB_HOST=localhost          # Database host
export DB_PORT=5432               # Database port
export DB_NAME=reactapp           # Database name
export DB_USER=postgres           # Database user
export DB_PASSWORD=your_password  # Database password
```

### Prerequisites
- PostgreSQL client tools (psql, pg_dump)
- Node.js runtime
- Sufficient database permissions for schema modifications

## Migration Process

### Phase 1: Assessment
1. **Run schema comparison** to identify differences
2. **Review generated migration script** for safety
3. **Create backup** of existing database
4. **Test on staging** if possible

### Phase 2: Migration
1. **Execute migration script** with safety checks
2. **Monitor for errors** during execution
3. **Validate post-migration state**
4. **Test application functionality**

### Phase 3: Verification
1. **Test frontend save operations** (especially mapping_code)
2. **Verify Prisma queries** work correctly
3. **Check data integrity** across all tables
4. **Performance testing** if large datasets

## Specific Fixes Applied

### mapping_code Column Fix
```sql
-- Add missing column safely
ALTER TABLE items ADD COLUMN IF NOT EXISTS mapping_code VARCHAR(100);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_items_mapping_code ON items(mapping_code);
```

### Prisma Schema Validation
The existing Prisma schema is correctly configured:
```prisma
model Item {
  // ... other fields
  mappingCode String? @map("mapping_code") @db.VarChar(100)
  // ... other fields
}
```

### Frontend Compatibility
No changes needed in frontend - it continues to use `mappingCode` field name, which Prisma automatically maps to `mapping_code` in the database.

## Rollback Procedures

### Automatic Rollback
```bash
# Rollback from last backup
./safe-migration.sh --rollback
```

### Manual Rollback
```bash
# Restore from specific backup file
psql -h localhost -U postgres -d reactapp < database/backups/pre_migration_YYYYMMDD_HHMMSS.sql
```

## Validation Checklist

### Pre-Migration
- [ ] Database connection verified
- [ ] Backup created successfully
- [ ] Migration script reviewed
- [ ] Staging environment tested

### Post-Migration
- [ ] All critical tables exist
- [ ] mapping_code column present in items table
- [ ] Frontend save operations work
- [ ] Prisma queries execute without errors
- [ ] Data integrity maintained
- [ ] No performance degradation

## Troubleshooting

### Common Issues

#### 1. Permission Denied
```bash
# Ensure database user has schema modification rights
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

#### 2. Connection Failed
```bash
# Verify database connection
psql -h localhost -U postgres -d reactapp -c "SELECT 1;"
```

#### 3. Migration Script Errors
```bash
# Check generated migration script
cat database/generated_migration.sql
```

#### 4. Rollback Issues
```bash
# Verify backup file exists
ls -la database/backups/
```

## Best Practices

### Before Migration
1. **Always create backups** before any schema changes
2. **Test on staging** environment first
3. **Schedule maintenance window** for production
4. **Communicate with users** about downtime

### During Migration
1. **Monitor logs** for any errors
2. **Validate each step** before proceeding
3. **Have rollback plan** ready
4. **Keep users informed** of progress

### After Migration
1. **Thoroughly test** all application features
2. **Monitor performance** metrics
3. **Document changes** for future reference
4. **Update deployment** procedures

## Monitoring and Maintenance

### Regular Checks
- Schema consistency across environments
- Migration script validation
- Backup verification
- Performance monitoring

### Automation
- CI/CD integration for schema validation
- Automated testing of migration scripts
- Regular backup scheduling
- Health monitoring dashboards

## Support

For issues during migration:
1. Check logs in `backend.log` and `frontend.log`
2. Review generated migration scripts
3. Verify database permissions
4. Test with rollback if needed

## Future Prevention

### Development Practices
1. **Schema-first development** - update Prisma schema first
2. **Migration testing** in CI/CD pipeline
3. **Version-controlled migrations** with proper sequencing
4. **Automated validation** of schema consistency

### Deployment Process
1. **Schema comparison** before each deployment
2. **Automated migration** generation and validation
3. **Staging testing** requirement
4. **Rollback verification** before production deployment
