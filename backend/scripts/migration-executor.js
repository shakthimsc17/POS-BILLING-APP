#!/usr/bin/env node

/**
 * Safe Migration Executor
 * Executes database migrations with validation and rollback capabilities
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationExecutor {
  constructor() {
    this.prisma = new PrismaClient();
    this.backupPath = null;
  }

  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `pre_migration_backup_${timestamp}.sql`;
    this.backupPath = path.join(__dirname, '../../database', backupFileName);
    
    try {
      console.log('🔄 Creating database backup...');
      
      // Use pg_dump to create backup
      const { execSync } = await import('child_process');
      const dbUrl = process.env.DATABASE_URL;
      
      // Parse database URL to extract connection details
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || 5432;
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;
      
      // Set PGPASSWORD environment variable for pg_dump
      process.env.PGPASSWORD = password;
      
      const dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists --no-owner --no-privileges > "${this.backupPath}"`;
      
      execSync(dumpCommand, { stdio: 'inherit' });
      
      console.log(`✅ Backup created: ${this.backupPath}`);
      return this.backupPath;
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    }
  }

  async validateMigrationScript(migrationScript) {
    console.log('🔍 Validating migration script...');
    
    // Basic validation checks
    const checks = [
      {
        name: 'BEGIN/COMMIT transaction',
        test: script => script.includes('BEGIN;') && script.includes('COMMIT;')
      },
      {
        name: 'No destructive operations',
        test: script => !script.toLowerCase().includes('drop table') && 
                     !script.toLowerCase().includes('delete from')
      },
      {
        name: 'IF NOT EXISTS clauses',
        test: script => script.includes('IF NOT EXISTS') || script.includes('ADD COLUMN IF NOT EXISTS')
      }
    ];
    
    const results = checks.map(check => ({
      name: check.name,
      passed: check.test(migrationScript)
    }));
    
    const failedChecks = results.filter(r => !r.passed);
    
    if (failedChecks.length > 0) {
      console.log('⚠️  Validation warnings:');
      failedChecks.forEach(check => {
        console.log(`  - ${check.name}`);
      });
    } else {
      console.log('✅ Migration script validation passed');
    }
    
    return failedChecks.length === 0;
  }

  async executeMigration(migrationScript, dryRun = false) {
    try {
      if (dryRun) {
        console.log('🔍 DRY RUN: Would execute migration script');
        console.log('Script preview (first 500 chars):');
        console.log(migrationScript.substring(0, 500) + '...');
        return { success: true, dryRun: true };
      }
      
      console.log('🚀 Executing migration...');
      
      // Split script into individual statements
      const statements = migrationScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          await this.prisma.$executeRawUnsafe(`${statement};`);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          console.error(`Statement: ${statement}`);
          throw error;
        }
      }
      
      console.log('✅ Migration completed successfully');
      return { success: true, dryRun: false };
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  async rollbackMigration() {
    if (!this.backupPath) {
      throw new Error('No backup file available for rollback');
    }
    
    try {
      console.log('🔄 Rolling back migration...');
      
      const { execSync } = await import('child_process');
      const dbUrl = process.env.DATABASE_URL;
      
      // Parse database URL
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || 5432;
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;
      
      process.env.PGPASSWORD = password;
      
      const restoreCommand = `psql -h ${host} -p ${port} -U ${username} -d ${database} < "${this.backupPath}"`;
      
      execSync(restoreCommand, { stdio: 'inherit' });
      
      console.log('✅ Rollback completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  async validatePostMigration() {
    console.log('🔍 Validating post-migration state...');
    
    try {
      // Test basic database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test critical tables exist
      const criticalTables = ['customers', 'items', 'categories', 'transactions'];
      const tableChecks = [];
      
      for (const table of criticalTables) {
        try {
          await this.prisma.$queryRawUnsafe`SELECT COUNT(*) FROM ${table}`;
          tableChecks.push({ table, status: 'OK' });
        } catch (error) {
          tableChecks.push({ table, status: 'ERROR', error: error.message });
        }
      }
      
      const failedChecks = tableChecks.filter(c => c.status === 'ERROR');
      
      if (failedChecks.length > 0) {
        console.log('❌ Post-migration validation failed:');
        failedChecks.forEach(check => {
          console.log(`  - ${check.table}: ${check.error}`);
        });
        return false;
      }
      
      console.log('✅ Post-migration validation passed');
      return true;
    } catch (error) {
      console.error('❌ Post-migration validation failed:', error.message);
      return false;
    }
  }

  async runMigration(migrationScript, options = {}) {
    const { dryRun = false, skipBackup = false, skipValidation = false } = options;
    
    try {
      console.log('🚀 Starting migration process...\n');
      
      // Step 1: Create backup (unless skipped)
      if (!skipBackup && !dryRun) {
        await this.createDatabaseBackup();
      }
      
      // Step 2: Validate migration script (unless skipped)
      if (!skipValidation) {
        const isValid = await this.validateMigrationScript(migrationScript);
        if (!isValid && !dryRun) {
          throw new Error('Migration script validation failed. Use --skip-validation to override.');
        }
      }
      
      // Step 3: Execute migration
      const migrationResult = await this.executeMigration(migrationScript, dryRun);
      
      if (dryRun) {
        return migrationResult;
      }
      
      // Step 4: Post-migration validation
      const isValidAfter = await this.validatePostMigration();
      if (!isValidAfter) {
        console.log('⚠️  Post-migration validation failed. Consider rolling back.');
        return { success: false, needsRollback: true };
      }
      
      console.log('\n🎉 Migration completed successfully!');
      console.log(`📁 Backup available at: ${this.backupPath}`);
      
      return { success: true, needsRollback: false };
    } catch (error) {
      console.error('\n❌ Migration process failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const migrationFile = args.find(arg => !arg.startsWith('--'));
  
  const options = {
    dryRun: args.includes('--dry-run'),
    skipBackup: args.includes('--skip-backup'),
    skipValidation: args.includes('--skip-validation')
  };
  
  if (!migrationFile && !options.dryRun) {
    console.error('Usage: node migration-executor.js <migration-file> [options]');
    console.error('Options:');
    console.error('  --dry-run        Show what would be executed without running it');
    console.error('  --skip-backup    Skip creating database backup');
    console.error('  --skip-validation Skip migration script validation');
    process.exit(1);
  }
  
  const executor = new MigrationExecutor();
  
  if (options.dryRun) {
    // Run schema comparison in dry-run mode
    const SchemaComparator = (await import('./schema-comparator.js')).default;
    const comparator = new SchemaComparator();
    
    comparator.runComparison()
      .then(({ differences, migrationScript }) => {
        if (migrationScript) {
          return executor.runMigration(migrationScript, { dryRun: true });
        }
        console.log('No migration needed');
        return Promise.resolve();
      })
      .then(() => {
        return Promise.all([comparator.disconnect(), executor.disconnect()]);
      })
      .catch(error => {
        console.error('❌ Dry run failed:', error);
        process.exit(1);
      });
  } else {
    const migrationScript = fs.readFileSync(migrationFile, 'utf8');
    
    executor.runMigration(migrationScript, options)
      .then(result => {
        if (result.needsRollback) {
          console.log('\n⚠️  Migration completed but validation failed.');
          console.log('Run rollback if needed: node migration-executor.js --rollback');
        }
        return executor.disconnect();
      })
      .catch(error => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  }
}

export default MigrationExecutor;
