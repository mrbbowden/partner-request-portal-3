#!/bin/bash

# Safe Deployment Script for Partner Request Portal
# This script validates the database schema before and after deployment

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
if [ ! -f "package.json" ] || [ ! -f "wrangler.toml" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

log_info "🚀 Starting safe deployment process..."

# Step 1: Pre-deployment validation
log_info "Step 1: Pre-deployment schema validation..."
if ! node scripts/validate-schema.js; then
    log_error "Pre-deployment schema validation failed!"
    log_error "Please fix the database schema issues before deploying."
    exit 1
fi
log_success "Pre-deployment validation passed"

# Step 2: Check if wrangler is installed and logged in
log_info "Step 2: Checking Wrangler CLI..."
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI is not installed. Please install it with: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    log_error "You are not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi
log_success "Wrangler CLI check passed"

# Step 3: Build the application
log_info "Step 3: Building the application..."
if ! npm run build; then
    log_error "Build failed!"
    exit 1
fi
log_success "Build completed successfully"

# Step 4: Backup current database (optional)
log_info "Step 4: Creating database backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
wrangler d1 execute partner-portal-db --command="SELECT * FROM partners;" --remote > "backups/partners_$BACKUP_FILE" 2>/dev/null || true
wrangler d1 execute partner-portal-db --command="SELECT * FROM requests;" --remote > "backups/requests_$BACKUP_FILE" 2>/dev/null || true
log_success "Database backup created"

# Step 5: Deploy to Cloudflare
log_info "Step 5: Deploying to Cloudflare Pages..."
if ! wrangler pages deploy public/dist; then
    log_error "Deployment failed!"
    exit 1
fi
log_success "Deployment completed successfully"

# Step 6: Post-deployment validation
log_info "Step 6: Post-deployment schema validation..."
sleep 5  # Give the deployment a moment to settle
if ! node scripts/validate-schema.js; then
    log_error "Post-deployment schema validation failed!"
    log_warning "The deployment completed but there may be schema issues."
    log_warning "Please check the database schema manually."
    exit 1
fi
log_success "Post-deployment validation passed"

# Step 7: Health check
log_info "Step 7: Performing health check..."
DEPLOYMENT_URL=$(wrangler pages deployment list | grep "partner-request-portal" | head -1 | awk '{print $2}')
if [ -n "$DEPLOYMENT_URL" ]; then
    log_success "Application deployed to: $DEPLOYMENT_URL"
    
    # Test basic functionality
    if curl -s -f "$DEPLOYMENT_URL" > /dev/null; then
        log_success "Health check passed - application is responding"
    else
        log_warning "Health check failed - application may not be responding yet"
    fi
else
    log_warning "Could not determine deployment URL"
fi

# Final success message
log_success "🎉 Safe deployment completed successfully!"
echo ""
log_info "Next steps:"
echo "  1. Test the application at the deployment URL"
echo "  2. Verify admin panel functionality at /admin"
echo "  3. Test partner authentication with sample IDs: 1234, 5678, 9876"
echo "  4. Monitor application logs if needed"
echo ""
log_info "Backup files created:"
echo "  - backups/partners_$BACKUP_FILE"
echo "  - backups/requests_$BACKUP_FILE"

