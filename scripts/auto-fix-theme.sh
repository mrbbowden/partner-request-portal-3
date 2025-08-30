#!/bin/bash

# Auto-Fix Theme Script
# Detects theme issues and automatically fixes them
# Updated for current application structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "tailwind.config.ts" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

log_info "🔧 Starting automatic theme detection and repair..."
echo ""

# Step 1: Run theme validation to detect issues
log_info "Step 1: Detecting theme issues..."
THEME_ISSUES=$(node scripts/validate-theme.js 2>&1 | grep -E "(❌|⚠️)" | wc -l)
UI_ISSUES=$(node scripts/check-ui-consistency.js 2>&1 | grep -E "(❌|⚠️)" | wc -l)

if [ "$THEME_ISSUES" -eq 0 ] && [ "$UI_ISSUES" -eq 0 ]; then
    log_success "No theme issues detected!"
    log_info "Your theme is already working correctly."
    exit 0
fi

log_warning "Detected $THEME_ISSUES theme configuration issues and $UI_ISSUES UI consistency issues"
echo ""

# Step 2: Create backup before making changes
log_info "Step 2: Creating backup before making changes..."
BACKUP_DIR="backups/theme-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup critical theme files
cp -r public/src/components "$BACKUP_DIR/" 2>/dev/null || true
cp -r public/src/pages "$BACKUP_DIR/" 2>/dev/null || true
cp tailwind.config.ts "$BACKUP_DIR/" 2>/dev/null || true
cp public/src/index.css "$BACKUP_DIR/" 2>/dev/null || true
cp public/src/App.tsx "$BACKUP_DIR/" 2>/dev/null || true
cp public/src/main.tsx "$BACKUP_DIR/" 2>/dev/null || true

log_success "Backup created: $BACKUP_DIR"
echo ""

# Step 3: Run automatic theme repair
log_info "Step 3: Running automatic theme repair..."
if node scripts/fix-theme.js; then
    log_success "Theme repair completed"
else
    log_error "Theme repair failed"
    log_info "Restoring from backup..."
    cp -r "$BACKUP_DIR/components/" public/src/ 2>/dev/null || true
    cp -r "$BACKUP_DIR/pages/" public/src/ 2>/dev/null || true
    cp "$BACKUP_DIR/tailwind.config.ts" . 2>/dev/null || true
    cp "$BACKUP_DIR/index.css" public/src/ 2>/dev/null || true
    cp "$BACKUP_DIR/App.tsx" public/src/ 2>/dev/null || true
    cp "$BACKUP_DIR/main.tsx" public/src/ 2>/dev/null || true
    log_error "Theme repair failed and backup restored"
    exit 1
fi
echo ""

# Step 4: Verify fixes
log_info "Step 4: Verifying theme fixes..."
echo ""

# Run theme validation again
log_info "Running theme validation..."
if node scripts/validate-theme.js; then
    log_success "Theme validation passed!"
else
    log_warning "Theme validation still has some issues"
fi
echo ""

# Run UI consistency check
log_info "Running UI consistency check..."
if node scripts/check-ui-consistency.js; then
    log_success "UI consistency check passed!"
else
    log_warning "UI consistency check still has some issues"
fi
echo ""

# Step 5: Summary
log_info "Step 5: Summary of changes..."
echo ""

if [ -d "$BACKUP_DIR" ]; then
    log_info "Backup location: $BACKUP_DIR"
    log_info "You can restore from backup if needed by copying files back"
fi

log_success "Auto-fix theme process completed!"
log_info "Check the validation results above for any remaining issues"

# Optional: Clean up old backups (keep last 5)
log_info "Cleaning up old backups..."
BACKUP_COUNT=$(find backups/ -maxdepth 1 -type d -name "theme-backup-*" | wc -l)
if [ "$BACKUP_COUNT" -gt 5 ]; then
    OLD_BACKUPS=$(find backups/ -maxdepth 1 -type d -name "theme-backup-*" | sort | head -n -5)
    if [ -n "$OLD_BACKUPS" ]; then
        echo "$OLD_BACKUPS" | xargs rm -rf
        log_info "Removed $(echo "$OLD_BACKUPS" | wc -l) old backups"
    fi
fi

echo ""
log_success "🎉 Theme auto-fix process completed successfully!"
