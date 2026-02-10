@echo off
REM =====================================================
REM Safe Database Migration Script (Windows Version)
REM For POS Billing Application Deployment
REM =====================================================

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=.\database\backups
set MIGRATION_DIR=.\database
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=pre_migration_%TIMESTAMP%.sql

echo ====================================================
echo POS Billing System - Safe Migration Script (Windows)
echo ====================================================
echo.

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Load environment variables from .env file if it exists
if exist "backend\.env" (
    echo Loading environment variables from backend\.env
    REM Simple .env parsing (basic implementation)
    for /f "tokens=1,2 delims==" %%a in (backend\.env) do (
        set %%a=%%b
    )
)

REM Set defaults
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432

REM Check required environment variables
if "%DB_NAME%"=="" (
    echo ❌ Required environment variable not set: DB_NAME
    goto :usage
)
if "%DB_USER%"=="" (
    echo ❌ Required environment variable not set: DB_USER
    goto :usage
)
if "%DB_PASSWORD%"=="" (
    echo ❌ Required environment variable not set: DB_PASSWORD
    goto :usage
)

REM Parse command line arguments
if "%1"=="--check-only" goto :check_only
if "%1"=="--backup-only" goto :backup_only
if "%1"=="--mapping-code-only" goto :mapping_code_only
if "%1"=="--all-migrations" goto :all_migrations
if "%1"=="--rollback" goto :rollback
if "%1"=="--dry-run" goto :dry_run
if "%1"=="--help" goto :usage
if "%1"=="-h" goto :usage

REM Default behavior - run full migration
goto :full_migration

:check_postgres
echo Checking PostgreSQL connection...

REM Check if psql command exists
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ psql command not found. Please install PostgreSQL client.
    exit /b 1
)

REM Test database connection
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot connect to database. Please check connection parameters.
    exit /b 1
)

echo ✅ PostgreSQL connection verified
goto :eof

:create_backup
echo Creating database backup...

set backup_path=%BACKUP_DIR%\%BACKUP_FILE%

set PGPASSWORD=%DB_PASSWORD%
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --clean --if-exists --no-owner --no-privileges > "%backup_path%"

if errorlevel 1 (
    echo ❌ Backup creation failed
    exit /b 1
)

echo ✅ Backup created: %backup_path%
echo %backup_path% > "%BACKUP_DIR%\last_backup.txt"
goto :eof

:run_schema_comparison
echo Running schema comparison...

cd backend
node scripts\schema-comparator.js
cd ..

goto :eof

:apply_mapping_code_migration
echo Applying mapping_code migration...

REM Check if mapping_code column exists
set PGPASSWORD=%DB_PASSWORD%
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mapping_code');"') do set column_exists=%%i
set column_exists=%column_exists: =%

if "%column_exists%"=="t" (
    echo ✅ mapping_code column already exists
) else (
    echo Adding mapping_code column...
    
    set PGPASSWORD=%DB_PASSWORD%
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ALTER TABLE items ADD COLUMN IF NOT EXISTS mapping_code VARCHAR(100); CREATE INDEX IF NOT EXISTS idx_items_mapping_code ON items(mapping_code);"
    
    if errorlevel 1 (
        echo ❌ Failed to add mapping_code column
        exit /b 1
    )
    
    echo ✅ mapping_code column added successfully
)
goto :eof

:apply_all_migrations
echo Applying all missing migrations...

REM Apply individual migration scripts in order
set migrations=add_display_name_column.sql add_mapping_code_column.sql add_autoprint_setting.sql add_missing_tables.sql

for %%m in (%migrations%) do (
    set migration_path=%MIGRATION_DIR%\%%m
    
    if exist "!migration_path!" (
        echo Applying %%m...
        set PGPASSWORD=%DB_PASSWORD%
        psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "!migration_path!"
        
        if errorlevel 1 (
            echo ❌ Failed to apply %%m
            exit /b 1
        )
        
        echo ✅ %%m applied successfully
    ) else (
        echo ⚠️  Migration file %%m not found, skipping
    )
)
goto :eof

:validate_migration
echo Validating post-migration state...

REM Check critical tables
set critical_tables=customers items categories transactions
set validation_failed=false

for %%t in (%critical_tables%) do (
    set PGPASSWORD=%DB_PASSWORD%
    for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '%%t');"') do set table_exists=%%i
    set table_exists=%table_exists: =%
    
    if "!table_exists!"=="t" (
        echo ✅ Table %%t exists
    ) else (
        echo ❌ Table %%t missing
        set validation_failed=true
    )
)

REM Check mapping_code column specifically
set PGPASSWORD=%DB_PASSWORD%
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mapping_code');"') do set mapping_code_exists=%%i
set mapping_code_exists=%mapping_code_exists: =%

if "%mapping_code_exists%"=="t" (
    echo ✅ mapping_code column exists in items table
) else (
    echo ❌ mapping_code column missing from items table
    set validation_failed=true
)

if "%validation_failed%"=="true" (
    echo ❌ Post-migration validation failed
    exit /b 1
) else (
    echo ✅ Post-migration validation passed
)
goto :eof

:rollback
echo Rolling back from backup...

if not exist "%BACKUP_DIR%\last_backup.txt" (
    echo ❌ No backup file found for rollback
    exit /b 1
)

set /p backup_file=<"%BACKUP_DIR%\last_backup.txt"

if not exist "%backup_file%" (
    echo ❌ Backup file not found: %backup_file%
    exit /b 1
)

echo Restoring from backup: %backup_file%

set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% < "%backup_file%"

if errorlevel 1 (
    echo ❌ Rollback failed
    exit /b 1
)

echo ✅ Rollback completed successfully
goto :eof

:usage
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   --check-only         Only check database connection and schema
echo   --backup-only        Only create backup, don't migrate
echo   --mapping-code-only  Apply only mapping_code migration
echo   --all-migrations     Apply all missing migrations
echo   --rollback           Rollback from last backup
echo   --dry-run            Show what would be done without executing
echo.
echo Environment Variables:
echo   DB_HOST              Database host (default: localhost)
echo   DB_PORT              Database port (default: 5432)
echo   DB_NAME              Database name
echo   DB_USER              Database user
echo   DB_PASSWORD          Database password
echo.
echo Examples:
echo   %0 --all-migrations
echo   %0 --mapping-code-only
echo   %0 --rollback
goto :eof

:check_only
call :check_postgres
call :run_schema_comparison
exit /b 0

:backup_only
call :check_postgres
call :create_backup
exit /b 0

:mapping_code_only
call :check_postgres
call :create_backup
call :apply_mapping_code_migration
call :validate_migration
exit /b 0

:all_migrations
call :check_postgres
call :create_backup
call :apply_all_migrations
call :validate_migration
exit /b 0

:dry_run
echo DRY RUN MODE - No changes will be made
call :check_postgres
call :run_schema_comparison
exit /b 0

:full_migration
call :check_postgres
call :create_backup
call :run_schema_comparison
call :apply_mapping_code_migration
call :apply_all_migrations
call :validate_migration
echo 🎉 Migration completed successfully!
echo Backup available at: %BACKUP_DIR%\%BACKUP_FILE%
exit /b 0
