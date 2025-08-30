#!/bin/bash

# Database Backup Script for Partner Request Portal
# Creates backups of all database tables
# Updated for current application structure

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI is not installed or not in PATH"
    log_info "Please install wrangler: npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    log_error "Not logged in to Cloudflare"
    log_info "Please run: wrangler login"
    exit 1
fi

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/backup_$TIMESTAMP"

log_info "Creating database backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup partners table
log_info "Backing up partners table..."
if wrangler d1 execute partner-portal-db --command="SELECT * FROM partners;" --remote > "$BACKUP_DIR/partners.sql" 2>/dev/null; then
    log_success "Partners table backed up successfully"
else
    log_warning "Could not backup partners table (might be empty or error)"
    echo "-- Partners table backup (empty or error)" > "$BACKUP_DIR/partners.sql"
fi

# Backup requests table
log_info "Backing up requests table..."
if wrangler d1 execute partner-portal-db --command="SELECT * FROM requests;" --remote > "$BACKUP_DIR/requests.sql" 2>/dev/null; then
    log_success "Requests table backed up successfully"
else
    log_warning "Could not backup requests table (might be empty or error)"
    echo "-- Requests table backup (empty or error)" > "$BACKUP_DIR/requests.sql"
fi

# Backup schema
log_info "Backing up database schema..."
if wrangler d1 execute partner-portal-db --command="SELECT sql FROM sqlite_master WHERE type='table';" --remote > "$BACKUP_DIR/schema.sql" 2>/dev/null; then
    log_success "Database schema backed up successfully"
else
    log_warning "Could not backup schema"
    echo "-- Schema backup (error)" > "$BACKUP_DIR/schema.sql"
fi

# Backup table structure details
log_info "Backing up table structure details..."
if wrangler d1 execute partner-portal-db --command="PRAGMA table_info(partners);" --remote > "$BACKUP_DIR/partners_structure.sql" 2>/dev/null; then
    log_success "Partners table structure backed up"
else
    log_warning "Could not backup partners table structure"
    echo "-- Partners table structure backup (error)" > "$BACKUP_DIR/partners_structure.sql"
fi

if wrangler d1 execute partner-portal-db --command="PRAGMA table_info(requests);" --remote > "$BACKUP_DIR/requests_structure.sql" 2>/dev/null; then
    log_success "Requests table structure backed up"
else
    log_warning "Could not backup requests table structure"
    echo "-- Requests table structure backup (error)" > "$BACKUP_DIR/requests_structure.sql"
fi

# Create a summary file
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Database Backup Information
==========================
Backup Date: $(date)
Backup Time: $(date +%H:%M:%S)
Database: partner-portal-db
Tables: partners, requests

Files included:
- partners.sql: Partners table data
- requests.sql: Requests table data  
- schema.sql: Database schema
- partners_structure.sql: Partners table structure
- requests_structure.sql: Requests table structure
- backup_info.txt: This file

Current Application Structure:
- Partners table: id, partner_name, partner_email, partner_phone, partner_address (street/city/state/zip)
- Requests table: id, partner_id, partner_name, case_manager_*, recipients_*, race, ethnicity, household_info, employed_household, english_speaking, description_of_need, created_at

To restore from this backup:
1. Check the schema.sql file for table definitions
2. Use the data files to restore table contents
3. Run: wrangler d1 execute partner-portal-db --file=path/to/backup/file --remote

To validate schema after restore:
1. Run: node scripts/validate-schema.js
2. Run: node scripts/check-schema.js
EOF

log_success "Database backup completed!"
log_info "Backup location: $BACKUP_DIR"
log_info "Files created:"
echo "  - $BACKUP_DIR/partners.sql"
echo "  - $BACKUP_DIR/requests.sql"
echo "  - $BACKUP_DIR/schema.sql"
echo "  - $BACKUP_DIR/partners_structure.sql"
echo "  - $BACKUP_DIR/requests_structure.sql"
echo "  - $BACKUP_DIR/backup_info.txt"

# Keep only the last 10 backups
log_info "Cleaning up old backups (keeping last 10)..."
cd backups
ls -t | tail -n +11 | xargs -r rm -rf
cd ..

log_success "Backup process completed successfully!"
log_info "You can now validate your schema with: node scripts/validate-schema.js"
