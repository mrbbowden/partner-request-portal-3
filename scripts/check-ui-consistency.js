#!/usr/bin/env node

/**
 * UI Consistency Check Script
 * Validates UI component styling consistency and theme implementation
 * Updated for current application structure
 */

import fs from 'fs';
import path from 'path';

// UI consistency rules
const UI_CONSISTENCY_RULES = {
  // Color consistency
  colors: {
    primary: ['bg-blue-', 'text-blue-', 'border-blue-'],
    secondary: ['bg-gray-', 'text-gray-', 'border-gray-'],
    success: ['bg-green-', 'text-green-', 'border-green-'],
    warning: ['bg-yellow-', 'text-yellow-', 'border-yellow-'],
    error: ['bg-red-', 'text-red-', 'border-red-']
  },
  
  // Spacing consistency
  spacing: ['p-', 'm-', 'gap-', 'space-'],
  
  // Typography consistency
  typography: ['text-', 'font-', 'leading-', 'tracking-'],
  
  // Layout consistency
  layout: ['flex', 'grid', 'block', 'inline', 'hidden'],
  
  // Theme-specific classes
  themeClasses: {
    light: ['bg-white', 'text-gray-900', 'border-gray-200'],
    dark: ['dark:bg-gray-900', 'dark:text-white', 'dark:border-gray-700'],
    transitions: ['transition-', 'duration-', 'ease-']
  }
};

// Critical UI components to check (updated for current structure)
const CRITICAL_COMPONENTS = [
  'public/src/components/ui/button.tsx',
  'public/src/components/ui/card.tsx',
  'public/src/components/ui/input.tsx',
  'public/src/components/ui/form.tsx',
  'public/src/components/ui/dialog.tsx',
  'public/src/components/theme-toggle.tsx',
  'public/src/components/partner-info.tsx',
  'public/src/components/request-form.tsx',
  'public/src/components/partner-lookup.tsx'
];

// Main application components to check
const MAIN_COMPONENTS = [
  'public/src/pages/partner-portal.tsx',
  'public/src/pages/admin.tsx'
];

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

function extractClassesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract className attributes
    const classNameMatches = content.match(/className\s*=\s*["'`]([^"'`]+)["'`]/g) || [];
    const classNames = classNameMatches.map(match => {
      const classMatch = match.match(/className\s*=\s*["'`]([^"'`]+)["'`]/);
      return classMatch ? classMatch[1] : '';
    });
    
    // Extract template literals with className
    const templateMatches = content.match(/className\s*=\s*\{[^}]+\}/g) || [];
    const templateClasses = templateMatches.map(match => {
      // Extract class names from template literals
      const classMatch = match.match(/["'`]([^"'`]+)["'`]/g);
      return classMatch ? classMatch.map(c => c.replace(/["'`]/g, '')).join(' ') : '';
    });
    
    return [...classNames, ...templateClasses].filter(Boolean);
  } catch (error) {
    log(`Error reading file ${filePath}: ${error.message}`, 'error');
    return [];
  }
}

function analyzeColorConsistency(classes) {
  const issues = [];
  const colorUsage = {};
  
  // Count color usage
  Object.entries(UI_CONSISTENCY_RULES.colors).forEach(([colorType, patterns]) => {
    colorUsage[colorType] = 0;
    patterns.forEach(pattern => {
      classes.forEach(cls => {
        if (cls.includes(pattern)) {
          colorUsage[colorType]++;
        }
      });
    });
  });
  
  // Check for color balance
  const totalColors = Object.values(colorUsage).reduce((sum, count) => sum + count, 0);
  if (totalColors === 0) {
    issues.push('No color classes found');
  } else {
    // Check if primary colors are used
    if (colorUsage.primary === 0) {
      issues.push('No primary color usage found');
    }
    
    // Check if secondary colors are used
    if (colorUsage.secondary === 0) {
      issues.push('No secondary color usage found');
    }
  }
  
  return { issues, colorUsage };
}

function analyzeSpacingConsistency(classes) {
  const issues = [];
  const spacingUsage = {};
  
  UI_CONSISTENCY_RULES.spacing.forEach(spacingType => {
    spacingUsage[spacingType] = 0;
    classes.forEach(cls => {
      if (cls.includes(spacingType)) {
        spacingUsage[spacingType]++;
      }
    });
  });
  
  // Check for spacing balance
  const totalSpacing = Object.values(spacingUsage).reduce((sum, count) => sum + count, 0);
  if (totalSpacing === 0) {
    issues.push('No spacing classes found');
  }
  
  return { issues, spacingUsage };
}

function analyzeTypographyConsistency(classes) {
  const issues = [];
  const typographyUsage = {};
  
  UI_CONSISTENCY_RULES.typography.forEach(typographyType => {
    typographyUsage[typographyType] = 0;
    classes.forEach(cls => {
      if (cls.includes(typographyType)) {
        typographyUsage[typographyType]++;
      }
    });
  });
  
  // Check for typography balance
  const totalTypography = Object.values(typographyUsage).reduce((sum, count) => sum + count, 0);
  if (totalTypography === 0) {
    issues.push('No typography classes found');
  }
  
  return { issues, typographyUsage };
}

function analyzeThemeConsistency(classes) {
  const issues = [];
  const themeUsage = {};
  
  Object.entries(UI_CONSISTENCY_RULES.themeClasses).forEach(([themeType, patterns]) => {
    themeUsage[themeType] = 0;
    patterns.forEach(pattern => {
      classes.forEach(cls => {
        if (cls.includes(pattern)) {
          themeUsage[themeType]++;
        }
      });
    });
  });
  
  // Check for theme balance
  if (themeUsage.light > 0 && themeUsage.dark === 0) {
    issues.push('Light theme classes found but no dark theme classes');
  }
  
  if (themeUsage.dark > 0 && themeUsage.light === 0) {
    issues.push('Dark theme classes found but no light theme classes');
  }
  
  return { issues, themeUsage };
}

function checkComponentConsistency(componentPath) {
  const fileName = path.basename(componentPath);
  log(`🔍 Checking ${fileName}...`, 'info');
  
  if (!fs.existsSync(componentPath)) {
    log(`⚠️  ${fileName} not found`, 'warning');
    return { consistent: false, issues: ['Component file not found'] };
  }
  
  const classes = extractClassesFromFile(componentPath);
  
  if (classes.length === 0) {
    log(`⚠️  ${fileName} has consistency issues:`, 'warning');
    log(`  - No classes found`, 'warning');
    return { consistent: false, issues: ['No classes found'] };
  }
  
  const colorAnalysis = analyzeColorConsistency(classes);
  const spacingAnalysis = analyzeSpacingConsistency(classes);
  const typographyAnalysis = analyzeTypographyConsistency(classes);
  const themeAnalysis = analyzeThemeConsistency(classes);
  
  const allIssues = [
    ...colorAnalysis.issues,
    ...spacingAnalysis.issues,
    ...typographyAnalysis.issues,
    ...themeAnalysis.issues
  ];
  
  if (allIssues.length > 0) {
    log(`⚠️  ${fileName} has consistency issues:`, 'warning');
    allIssues.forEach(issue => {
      log(`  - ${issue}`, 'warning');
    });
    return { consistent: false, issues: allIssues };
  }
  
  log(`✅ ${fileName} is consistent`, 'success');
  return { consistent: true, issues: [] };
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: results.length,
      consistentComponents: results.filter(r => r.consistent).length,
      componentsWithIssues: results.filter(r => !r.consistent).length,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0)
    },
    details: results.map(result => ({
      component: path.basename(result.componentPath),
      consistent: result.consistent,
      issues: result.issues
    }))
  };
  
  // Save report to file
  try {
    fs.writeFileSync('ui-consistency-report.json', JSON.stringify(report, null, 2));
    log('📄 Detailed report saved to: ui-consistency-report.json', 'info');
  } catch (error) {
    log(`⚠️  Could not save report: ${error.message}`, 'warning');
  }
  
  return report;
}

function main() {
  console.log('🎨 Starting UI consistency check...\n');
  
  const allComponents = [...CRITICAL_COMPONENTS, ...MAIN_COMPONENTS];
  const results = [];
  
  log('🎨 Checking UI consistency across all components...\n', 'info');
  
  // Check each component
  allComponents.forEach(componentPath => {
    const result = checkComponentConsistency(componentPath);
    results.push({
      ...result,
      componentPath
    });
    console.log('');
  });
  
  // Generate summary
  const report = generateReport(results);
  
  console.log('📊 UI Consistency Summary:');
  log(`  Total components checked: ${report.summary.totalComponents}`, 'info');
  log(`  Consistent components: ${report.summary.consistentComponents}`, 'success');
  log(`  Components with issues: ${report.summary.componentsWithIssues}`, 'warning');
  log(`  Total issues found: ${report.summary.totalIssues}`, 'warning');
  
  if (report.summary.componentsWithIssues > 0) {
    log('⚠️  UI consistency check found issues', 'warning');
    log('📄 Check the detailed report for specific issues', 'info');
  } else {
    log('✅ All components are consistent!', 'success');
  }
  
  return report.summary.componentsWithIssues === 0;
}

// Run the consistency check
main();
