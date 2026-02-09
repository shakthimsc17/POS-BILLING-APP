#!/usr/bin/env node

/**
 * Database Schema Comparison Utility
 * Compares existing database schema against reference schema and identifies differences
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchemaComparator {
  constructor() {
    this.prisma = new PrismaClient();
    this.referenceSchema = null;
    this.currentSchema = null;
    this.differences = [];
  }

  async loadReferenceSchema() {
    try {
      const schemaPath = path.join(__dirname, '../../database/reactapp');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Parse table definitions from SQL dump
      const tables = this.parseTablesFromSQL(schemaContent);
      this.referenceSchema = { tables };
      console.log('✅ Reference schema loaded successfully');
    } catch (error) {
      console.error('❌ Error loading reference schema:', error.message);
      throw error;
    }
  }

  async getCurrentDatabaseSchema() {
    try {
      const query = `
        SELECT 
          table_name,
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name NOT LIKE '_prisma_%'
        ORDER BY table_name, ordinal_position
      `;
      
      const result = await this.prisma.$queryRawUnsafe(query);
      
      const tables = {};
      result.forEach(row => {
        if (!tables[row.table_name]) {
          tables[row.table_name] = {
            name: row.table_name,
            columns: []
          };
        }
        
        tables[row.table_name].columns.push({
          name: row.column_name,
          type: row.data_type,
          maxLength: row.character_maximum_length,
          nullable: row.is_nullable === 'YES',
          default: row.column_default
        });
      });
      
      this.currentSchema = { tables };
      console.log('✅ Current database schema loaded successfully');
    } catch (error) {
      console.error('❌ Error loading current schema:', error.message);
      throw error;
    }
  }

  parseTablesFromSQL(sqlContent) {
    const tables = {};
    
    // Find CREATE TABLE statements more accurately
    const createTableRegex = /CREATE TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\s*\(([\s\S]*?)\)\s*(?:;|$)/gi;
    let match;
    
    while ((match = createTableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const tableContent = match[2];
      
      // Skip if it's a constraint or index definition
      if (tableName.toLowerCase().includes('constraint') || 
          tableName.toLowerCase().includes('index') ||
          tableName.toLowerCase().includes('sequence')) {
        continue;
      }
      
      const columns = [];
      
      // Parse column definitions more carefully
      const lines = tableContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('--'));
      
      for (const line of lines) {
        // Skip constraint definitions, primary keys, foreign keys, indexes
        if (line.toLowerCase().includes('constraint') || 
            line.toLowerCase().includes('primary key') ||
            line.toLowerCase().includes('foreign key') ||
            line.toLowerCase().includes('unique') ||
            line.toLowerCase().includes('check') ||
            line.toLowerCase().includes('index') ||
            line.startsWith(')')) {
          continue;
        }
        
        // Match column definition: column_name TYPE [NOT NULL] [DEFAULT value]
        const columnMatch = line.match(/^(\w+)\s+([^,\s]+(?:\([^)]*\))?)\s*(.*)$/);
        if (columnMatch) {
          const columnName = columnMatch[1];
          const columnType = columnMatch[2];
          const restOfLine = columnMatch[3] || '';
          
          // Extract nullable and default info
          const nullable = !restOfLine.toLowerCase().includes('not null');
          const defaultMatch = restOfLine.match(/default\s+([^,\s]+(?:\([^)]*\))?)/i);
          
          columns.push({
            name: columnName,
            type: columnType,
            nullable,
            default: defaultMatch ? defaultMatch[1] : null
          });
        }
      }
      
      if (columns.length > 0) {
        tables[tableName] = { name: tableName, columns };
      }
    }
    
    return tables;
  }

  compareSchemas() {
    this.differences = [];
    
    const refTables = Object.keys(this.referenceSchema.tables);
    const currentTables = Object.keys(this.currentSchema.tables);
    
    // Find missing tables
    refTables.forEach(table => {
      if (!currentTables.includes(table)) {
        this.differences.push({
          type: 'MISSING_TABLE',
          table,
          severity: 'HIGH'
        });
      }
    });
    
    // Find extra tables (might be custom additions)
    currentTables.forEach(table => {
      if (!refTables.includes(table)) {
        this.differences.push({
          type: 'EXTRA_TABLE',
          table,
          severity: 'LOW'
        });
      }
    });
    
    // Compare columns for existing tables
    refTables.forEach(table => {
      if (currentTables.includes(table)) {
        this.compareTableColumns(table);
      }
    });
    
    return this.differences;
  }

  compareTableColumns(tableName) {
    const refColumns = this.referenceSchema.tables[tableName].columns;
    const currentColumns = this.currentSchema.tables[tableName].columns;
    
    const refColumnNames = refColumns.map(c => c.name);
    const currentColumnNames = currentColumns.map(c => c.name);
    
    // Find missing columns
    refColumnNames.forEach(columnName => {
      if (!currentColumnNames.includes(columnName)) {
        const refColumn = refColumns.find(c => c.name === columnName);
        this.differences.push({
          type: 'MISSING_COLUMN',
          table: tableName,
          column: columnName,
          expectedType: refColumn.type,
          nullable: refColumn.nullable,
          severity: 'HIGH'
        });
      }
    });
    
    // Find extra columns
    currentColumnNames.forEach(columnName => {
      if (!refColumnNames.includes(columnName)) {
        this.differences.push({
          type: 'EXTRA_COLUMN',
          table: tableName,
          column: columnName,
          severity: 'LOW'
        });
      }
    });
    
    // Check for type mismatches
    refColumnNames.forEach(columnName => {
      if (currentColumnNames.includes(columnName)) {
        const refColumn = refColumns.find(c => c.name === columnName);
        const currentColumn = currentColumns.find(c => c.name === columnName);
        
        if (refColumn.type !== currentColumn.type) {
          this.differences.push({
            type: 'TYPE_MISMATCH',
            table: tableName,
            column: columnName,
            expectedType: refColumn.type,
            actualType: currentColumn.type,
            severity: 'MEDIUM'
          });
        }
      }
    });
  }

  generateMigrationScript() {
    const highSeverityIssues = this.differences.filter(d => d.severity === 'HIGH');
    const mediumSeverityIssues = this.differences.filter(d => d.severity === 'MEDIUM');
    
    let migrationScript = '-- =====================================================\n';
    migrationScript += '-- Database Schema Migration Script\n';
    migrationScript += '-- Generated on: ' + new Date().toISOString() + '\n';
    migrationScript += '-- =====================================================\n\n';
    
    migrationScript += 'BEGIN;\n\n';
    
    // Add missing tables
    const missingTables = highSeverityIssues.filter(d => d.type === 'MISSING_TABLE');
    missingTables.forEach(issue => {
      migrationScript += this.generateCreateTableScript(issue.table);
    });
    
    // Add missing columns
    const missingColumns = highSeverityIssues.filter(d => d.type === 'MISSING_COLUMN');
    missingColumns.forEach(issue => {
      migrationScript += this.generateAddColumnScript(issue);
    });
    
    // Fix type mismatches
    const typeMismatches = mediumSeverityIssues.filter(d => d.type === 'TYPE_MISMATCH');
    typeMismatches.forEach(issue => {
      migrationScript += this.generateAlterColumnTypeScript(issue);
    });
    
    migrationScript += '\n-- Commit changes\nCOMMIT;\n';
    
    return migrationScript;
  }

  generateCreateTableScript(tableName) {
    const tableDef = this.referenceSchema.tables[tableName];
    let script = `-- Create missing table: ${tableName}\n`;
    script += `CREATE TABLE ${tableName} (\n`;
    
    tableDef.columns.forEach((column, index) => {
      script += `  ${column.name} ${column.type}`;
      if (!column.nullable) script += ' NOT NULL';
      if (column.default) script += ` DEFAULT ${column.default}`;
      if (index < tableDef.columns.length - 1) script += ',';
      script += '\n';
    });
    
    script += `);\n\n`;
    return script;
  }

  generateAddColumnScript(issue) {
    let script = `-- Add missing column: ${issue.table}.${issue.column}\n`;
    script += `ALTER TABLE ${issue.table} ADD COLUMN ${issue.column} ${issue.expectedType}`;
    if (!issue.nullable) script += ' NOT NULL';
    script += ';\n\n';
    return script;
  }

  generateAlterColumnTypeScript(issue) {
    let script = `-- Fix column type: ${issue.table}.${issue.column}\n`;
    script += `ALTER TABLE ${issue.table} ALTER COLUMN ${issue.column} TYPE ${issue.expectedType};\n\n`;
    return script;
  }

  async runComparison() {
    console.log('🔍 Starting schema comparison...\n');
    
    await this.loadReferenceSchema();
    await this.getCurrentDatabaseSchema();
    
    console.log('📊 Comparing schemas...\n');
    const differences = this.compareSchemas();
    
    if (differences.length === 0) {
      console.log('✅ No schema differences found!');
      return { differences: [], migrationScript: null };
    }
    
    console.log(`\n📋 Found ${differences.length} differences:`);
    
    const grouped = {
      HIGH: differences.filter(d => d.severity === 'HIGH'),
      MEDIUM: differences.filter(d => d.severity === 'MEDIUM'),
      LOW: differences.filter(d => d.severity === 'LOW')
    };
    
    Object.entries(grouped).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`\n🚨 ${severity} SEVERITY (${issues.length}):`);
        issues.forEach(issue => {
          console.log(`  - ${issue.type}: ${issue.table}${issue.column ? '.' + issue.column : ''}`);
        });
      }
    });
    
    const migrationScript = this.generateMigrationScript();
    
    return { differences, migrationScript };
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const comparator = new SchemaComparator();
  
  comparator.runComparison()
    .then(({ differences, migrationScript }) => {
      if (migrationScript) {
        const outputPath = path.join(__dirname, '../../database/generated_migration.sql');
        fs.writeFileSync(outputPath, migrationScript);
        console.log(`\n💾 Migration script saved to: ${outputPath}`);
      }
      
      console.log('\n✅ Schema comparison completed!');
      return comparator.disconnect();
    })
    .catch(error => {
      console.error('❌ Schema comparison failed:', error);
      process.exit(1);
    });
}

export default SchemaComparator;
