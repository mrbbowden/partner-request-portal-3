#!/usr/bin/env node

/**
 * Quick Schema Check Script
 * Simple validation to ensure database schema is correct
 * Updated for current application structure
 */

import { execSync } from 'child_process';

// Updated required columns for current application structure
const REQUIRED_PARTNERS_COLUMNS = [
  'id',
  'partner_name',
  'partner_email',
  'partner_phone',
  'partner_street_address',
  'partner_city',
  'partner_state',
  'partner_zip'
];

const REQUIRED_REQUESTS_COLUMNS = [
  'id',
  'partner_id',
  'partner_name',
  'case_manager_name',
  'case_manager_email',
  'case_manager_phone',
  'recipients_name',
  'recipients_street_address',
  'recipients_city',
  'recipients_state',
  'recipients_zip',
  'recipients_email',
  'recipients_phone',
  'race',
  'ethnicity',
  'number_of_men_in_household',
  'number_of_women_in_household',
  'number_of_children_in_household',
  'employed_household',
  'english_speaking',
  'description_of_need',
  'created_at'
];

function checkTableSchema(tableName, requiredColumns) {
  try {
    const output = execSync(
      `wrangler d1 execute partner-portal-db --command="PRAGMA table_info(${tableName});" --remote`,
      { encoding: 'utf8' }
    );
    
    // Parse JSON output
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error(`Could not parse JSON output for ${tableName}`);
      return { missing: requiredColumns, extra: [], valid: false };
    }
    
    const data = JSON.parse(jsonMatch[0]);
    const actualColumns = data[0]?.results?.map(col => col.name) || [];
    
    const missing = requiredColumns.filter(col => !actualColumns.includes(col));
    const extra = actualColumns.filter(col => !requiredColumns.includes(col));
    
    return { missing, extra, valid: missing.length === 0 };
  } catch (error) {
    console.error(`❌ Error checking ${tableName} schema:`, error.message);
    return { missing: requiredColumns, extra: [], valid: false };
  }
}

function main() {
  console.log('🔍 Quick schema validation...\n');
  
  // Check partners table
  console.log('Checking partners table...');
  const partnersCheck = checkTableSchema('partners', REQUIRED_PARTNERS_COLUMNS);
  
  if (partnersCheck.valid) {
    console.log('✅ Partners table schema is correct');
  } else {
    console.log('❌ Partners table schema issues:');
    if (partnersCheck.missing.length > 0) {
      console.log(`   Missing columns: ${partnersCheck.missing.join(', ')}`);
    }
    if (partnersCheck.extra.length > 0) {
      console.log(`   Extra columns: ${partnersCheck.extra.join(', ')}`);
    }
  }
  
  // Check requests table
  console.log('\nChecking requests table...');
  const requestsCheck = checkTableSchema('requests', REQUIRED_REQUESTS_COLUMNS);
  
  if (requestsCheck.valid) {
    console.log('✅ Requests table schema is correct');
  } else {
    console.log('❌ Requests table schema issues:');
    if (requestsCheck.missing.length > 0) {
      console.log(`   Missing columns: ${requestsCheck.missing.join(', ')}`);
    }
    if (requestsCheck.extra.length > 0) {
      console.log(`   Extra columns: ${requestsCheck.extra.join(', ')}`);
    }
  }
  
  // Overall result
  if (partnersCheck.valid && requestsCheck.valid) {
    console.log('\n🎉 All database schemas are correct!');
    console.log('✅ Your database structure matches the expected schema');
    return true;
  } else {
    console.log('\n❌ Database schema validation failed!');
    console.log('⚠️  Please update your database schema to match the expected structure');
    console.log('\n💡 You may need to run database migrations to add missing columns');
    return false;
  }
}

// Run the schema check
main();
