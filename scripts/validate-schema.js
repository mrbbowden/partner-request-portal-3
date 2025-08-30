#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * Ensures the production database schema matches the expected code schema
 * Updated for current application structure
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Expected schema based on functions/schema.ts - Updated for current structure
const EXPECTED_PARTNERS_SCHEMA = {
  id: { type: 'TEXT', notnull: false, pk: true },
  partner_name: { type: 'TEXT', notnull: true, pk: false },
  partner_email: { type: 'TEXT', notnull: true, pk: false },
  partner_phone: { type: 'TEXT', notnull: true, pk: false },
  partner_street_address: { type: 'TEXT', notnull: true, pk: false },
  partner_city: { type: 'TEXT', notnull: true, pk: false },
  partner_state: { type: 'TEXT', notnull: true, pk: false },
  partner_zip: { type: 'TEXT', notnull: true, pk: false }
};

const EXPECTED_REQUESTS_SCHEMA = {
  id: { type: 'TEXT', notnull: false, pk: true },
  partner_id: { type: 'TEXT', notnull: true, pk: false },
  partner_name: { type: 'TEXT', notnull: true, pk: false },
  case_manager_name: { type: 'TEXT', notnull: true, pk: false },
  case_manager_email: { type: 'TEXT', notnull: true, pk: false },
  case_manager_phone: { type: 'TEXT', notnull: true, pk: false },
  recipients_name: { type: 'TEXT', notnull: true, pk: false },
  recipients_street_address: { type: 'TEXT', notnull: true, pk: false },
  recipients_city: { type: 'TEXT', notnull: true, pk: false },
  recipients_state: { type: 'TEXT', notnull: true, pk: false },
  recipients_zip: { type: 'TEXT', notnull: true, pk: false },
  recipients_email: { type: 'TEXT', notnull: true, pk: false },
  recipients_phone: { type: 'TEXT', notnull: true, pk: false },
  race: { type: 'TEXT', notnull: true, pk: false },
  ethnicity: { type: 'TEXT', notnull: true, pk: false },
  number_of_men_in_household: { type: 'TEXT', notnull: true, pk: false },
  number_of_women_in_household: { type: 'TEXT', notnull: true, pk: false },
  number_of_children_in_household: { type: 'TEXT', notnull: true, pk: false },
  employed_household: { type: 'TEXT', notnull: true, pk: false },
  english_speaking: { type: 'TEXT', notnull: true, pk: false },
  description_of_need: { type: 'TEXT', notnull: true, pk: false },
  created_at: { type: 'TIMESTAMP', notnull: true, pk: false }
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function getDatabaseSchema(tableName) {
  try {
    const output = execSync(
      `wrangler d1 execute partner-portal-db --command="PRAGMA table_info(${tableName});" --remote`,
      { encoding: 'utf8' }
    );
    
    // Extract JSON from the output (remove wrangler header)
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in output');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    const schema = {};
    
    if (data && data[0] && data[0].results) {
      for (const column of data[0].results) {
        schema[column.name] = {
          type: column.type,
          notnull: column.notnull === 1,
          pk: column.pk === 1
        };
      }
    }
    
    return schema;
  } catch (error) {
    log(`Error getting schema for ${tableName}: ${error.message}`, 'error');
    return null;
  }
}

function compareSchemas(expected, actual, tableName) {
  const errors = [];
  const warnings = [];
  
  // Check for missing columns
  for (const [columnName, expectedDef] of Object.entries(expected)) {
    if (!actual[columnName]) {
      errors.push(`Missing column: ${columnName} in ${tableName}`);
      continue;
    }
    
    const actualDef = actual[columnName];
    
    // Check data type - be more flexible with type matching
    if (expectedDef.type !== actualDef.type) {
      // Allow some type variations (TEXT vs VARCHAR, etc.)
      const typeCompatible = (
        (expectedDef.type === 'TEXT' && actualDef.type === 'VARCHAR') ||
        (expectedDef.type === 'VARCHAR' && actualDef.type === 'TEXT') ||
        (expectedDef.type === 'VARCHAR' && actualDef.type.startsWith('VARCHAR')) ||
        (expectedDef.type === 'TIMESTAMP' && actualDef.type === 'DATETIME')
      );
      
      if (!typeCompatible) {
        warnings.push(`Column ${columnName} in ${tableName}: expected type ${expectedDef.type}, got ${actualDef.type}`);
      }
    }
    
    // Check not null constraint
    if (expectedDef.notnull !== actualDef.notnull) {
      errors.push(`Column ${columnName} in ${tableName}: notnull constraint mismatch`);
    }
    
    // Check primary key
    if (expectedDef.pk !== actualDef.pk) {
      errors.push(`Column ${columnName} in ${tableName}: primary key constraint mismatch`);
    }
  }
  
  // Check for extra columns (warn but don't error)
  for (const [columnName, actualDef] of Object.entries(actual)) {
    if (!expected[columnName]) {
      warnings.push(`Extra column: ${columnName} in ${tableName} (type: ${actualDef.type})`);
    }
  }
  
  return { errors, warnings };
}

function validateTable(tableName, expectedSchema) {
  log(`🔍 Validating ${tableName} table schema...`, 'info');
  
  const actualSchema = getDatabaseSchema(tableName);
  if (!actualSchema) {
    log(`❌ Could not retrieve schema for ${tableName}`, 'error');
    return false;
  }
  
  const { errors, warnings } = compareSchemas(expectedSchema, actualSchema, tableName);
  
  // Report warnings
  if (warnings.length > 0) {
    log(`⚠️  ${tableName} table schema warnings:`, 'warning');
    warnings.forEach(warning => log(`  - ${warning}`, 'warning'));
  }
  
  // Report errors
  if (errors.length > 0) {
    log(`❌ ${tableName} table schema errors:`, 'error');
    errors.forEach(error => log(`  - ${error}`, 'error'));
    return false;
  }
  
  log(`✅ ${tableName} table schema is valid`, 'success');
  return true;
}

function main() {
  console.log('🔍 Validating database schema...\n');
  
  let allValid = true;
  
  // Validate partners table
  if (!validateTable('partners', EXPECTED_PARTNERS_SCHEMA)) {
    allValid = false;
  }
  console.log('');
  
  // Validate requests table
  if (!validateTable('requests', EXPECTED_REQUESTS_SCHEMA)) {
    allValid = false;
  }
  console.log('');
  
  if (allValid) {
    log('🎉 Database schema validation passed!', 'success');
    log('✅ All tables have the expected structure', 'success');
  } else {
    log('❌ Database schema validation failed!', 'error');
    log('⚠️  Please review the errors above and update your database schema', 'warning');
  }
  
  return allValid;
}

// Run the validation
main();
