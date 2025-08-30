#!/bin/bash

# UI Theme Test Script
# Runs comprehensive theme validation and UI consistency checks

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

log_info "🎨 Starting comprehensive UI theme tests..."
echo ""

# Step 1: Theme validation
log_info "Step 1: Theme configuration validation..."
if node scripts/validate-theme.js; then
    log_success "Theme validation passed"
else
    log_error "Theme validation failed"
    exit 1
fi
echo ""

# Step 2: UI consistency check
log_info "Step 2: UI consistency check..."
if node scripts/check-ui-consistency.js; then
    log_success "UI consistency check passed"
else
    log_warning "UI consistency check found issues (continuing with tests)"
fi
echo ""

# Step 3: Build check
log_info "Step 3: Building application to check for theme-related build errors..."
if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed - theme issues may be present"
    exit 1
fi
echo ""

# Step 4: Check for theme-related dependencies
log_info "Step 4: Checking theme-related dependencies..."
MISSING_DEPS=()

# Check for next-themes
if ! npm list next-themes > /dev/null 2>&1; then
    MISSING_DEPS+=("next-themes")
fi

# Check for tailwindcss
if ! npm list tailwindcss > /dev/null 2>&1; then
    MISSING_DEPS+=("tailwindcss")
fi

# Check for @tailwindcss/typography
if ! npm list @tailwindcss/typography > /dev/null 2>&1; then
    MISSING_DEPS+=("@tailwindcss/typography")
fi

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    log_success "All theme dependencies are installed"
else
    log_warning "Missing theme dependencies: ${MISSING_DEPS[*]}"
    log_info "Consider installing: npm install ${MISSING_DEPS[*]}"
fi
echo ""

# Step 5: Check theme files exist
log_info "Step 5: Checking theme file integrity..."
THEME_FILES=(
    "tailwind.config.ts"
    "components.json"
    "public/src/index.css"
    "public/src/components/theme-toggle.tsx"
)

MISSING_FILES=()
for file in "${THEME_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "✓ $file exists"
    else
        log_error "✗ $file missing"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    log_error "Missing critical theme files: ${MISSING_FILES[*]}"
    exit 1
fi
echo ""

# Step 6: Check for common theme issues
log_info "Step 6: Checking for common theme issues..."

# Check if dark mode is configured in Tailwind
if grep -q "darkMode" tailwind.config.ts; then
    log_success "Dark mode is configured in Tailwind"
else
    log_warning "Dark mode not found in Tailwind config"
fi

# Check if CSS variables are defined
if grep -q "\\-\\-background" public/src/index.css || grep -q "\\-\\-foreground" public/src/index.css; then
    log_success "CSS variables are defined"
else
    log_warning "CSS variables not found in index.css"
fi

# Check if theme toggle component has proper imports
if grep -q "useTheme" public/src/components/theme-toggle.tsx; then
    log_success "Theme toggle has proper theme hook"
else
    log_warning "Theme toggle missing useTheme hook"
fi

# Check if theme toggle is included in main App
if grep -q "ThemeToggle" public/src/App.tsx; then
    log_success "Theme toggle is included in main App"
else
    log_warning "Theme toggle not found in main App"
fi
echo ""

# Step 7: Optional screenshot tests (if development server is running)
log_info "Step 7: Checking if development server is running for screenshot tests..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    log_success "Development server is running"
    log_info "Running screenshot tests..."
    if node scripts/ui-screenshot-test.js; then
        log_success "Screenshot tests passed"
    else
        log_warning "Screenshot tests found issues"
    fi
else
    log_warning "Development server not running - skipping screenshot tests"
    log_info "To run screenshot tests, start the dev server: npm run dev"
fi
echo ""

# Step 8: Generate theme test report
log_info "Step 8: Generating theme test report..."

REPORT_CONTENT="
# UI Theme Test Report
Generated: $(date)

## Test Results Summary
- Theme validation: $(node scripts/validate-theme.js > /dev/null 2>&1 && echo "PASSED" || echo "FAILED")
- UI consistency: $(node scripts/check-ui-consistency.js > /dev/null 2>&1 && echo "PASSED" || echo "FAILED")
- Build check: $(npm run build > /dev/null 2>&1 && echo "PASSED" || echo "FAILED")
- Dependencies: $(if [ ${#MISSING_DEPS[@]} -eq 0 ]; then echo "PASSED"; else echo "FAILED - Missing: ${MISSING_DEPS[*]}"; fi)
- File integrity: $(if [ ${#MISSING_FILES[@]} -eq 0 ]; then echo "PASSED"; else echo "FAILED - Missing: ${MISSING_FILES[*]}"; fi)

## Theme Configuration
- Tailwind config: $(if [ -f "tailwind.config.ts" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)
- Components config: $(if [ -f "components.json" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)
- CSS file: $(if [ -f "public/src/index.css" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)
- Theme toggle: $(if [ -f "public/src/components/theme-toggle.tsx" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)

## Recommendations
$(if [ ${#MISSING_DEPS[@]} -gt 0 ]; then echo "- Install missing dependencies: npm install ${MISSING_DEPS[*]}"; fi)
$(if [ ${#MISSING_FILES[@]} -gt 0 ]; then echo "- Create missing theme files: ${MISSING_FILES[*]}"; fi)
- Run 'npm run dev' to start development server for screenshot tests
- Check generated reports for detailed analysis
"

echo "$REPORT_CONTENT" > theme-test-report.md
log_success "Theme test report generated: theme-test-report.md"
echo ""

# Final summary
log_info "🎨 UI Theme Test Summary:"
echo "  📄 Theme validation: $(node scripts/validate-theme.js > /dev/null 2>&1 && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  🎨 UI consistency: $(node scripts/check-ui-consistency.js > /dev/null 2>&1 && echo "✅ PASSED" || echo "⚠️  ISSUES")"
echo "  🔨 Build check: $(npm run build > /dev/null 2>&1 && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  📦 Dependencies: $(if [ ${#MISSING_DEPS[@]} -eq 0 ]; then echo "✅ COMPLETE"; else echo "⚠️  MISSING"; fi)"
echo "  📁 File integrity: $(if [ ${#MISSING_FILES[@]} -eq 0 ]; then echo "✅ COMPLETE"; else echo "❌ MISSING"; fi)"
echo ""

# Check if all critical tests passed
CRITICAL_FAILURES=0

if ! node scripts/validate-theme.js > /dev/null 2>&1; then
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
fi

if ! npm run build > /dev/null 2>&1; then
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
fi

if [ $CRITICAL_FAILURES -eq 0 ]; then
    log_success "🎉 All critical UI theme tests passed!"
    log_success "✅ Your theme is properly configured and working"
    exit 0
else
    log_error "❌ $CRITICAL_FAILURES critical test(s) failed"
    log_warning "Please address the issues above before deploying"
    exit 1
fi

