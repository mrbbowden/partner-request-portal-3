#!/usr/bin/env node

/**
 * Theme Validation Script
 * Ensures UI theme consistency and identifies potential theme issues
 * Updated for current application structure
 */

import fs from 'fs';
import path from 'path';

// Theme configuration files to check
const THEME_FILES = [
  'tailwind.config.ts',
  'components.json',
  'public/src/index.css',
  'public/src/components/theme-toggle.tsx'
];

// Expected theme classes and patterns
const EXPECTED_THEME_CLASSES = {
  light: [
    'bg-white',
    'text-gray-900',
    'border-gray-200',
    'bg-gray-50',
    'text-gray-600'
  ],
  dark: [
    'dark:bg-gray-900',
    'dark:text-white',
    'dark:border-gray-700',
    'dark:bg-gray-800',
    'dark:text-gray-300'
  ],
  common: [
    'transition-colors',
    'duration-200',
    'ease-in-out'
  ]
};

// UI components that should have theme support (updated for current structure)
const THEME_COMPONENTS = [
  'public/src/components/ui/button.tsx',
  'public/src/components/ui/card.tsx',
  'public/src/components/ui/input.tsx',
  'public/src/components/ui/dialog.tsx',
  'public/src/components/ui/form.tsx',
  'public/src/components/theme-toggle.tsx'
];

// Main application components to check
const MAIN_COMPONENTS = [
  'public/src/components/request-form.tsx',
  'public/src/components/partner-lookup.tsx',
  'public/src/components/partner-info.tsx',
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

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function validateTailwindConfig() {
  log('🔍 Validating Tailwind configuration...', 'info');
  
  const configPath = 'tailwind.config.ts';
  if (!checkFileExists(configPath)) {
    log('❌ Tailwind config file not found', 'error');
    return false;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for essential theme configurations
    const requiredConfigs = [
      'darkMode',
      'theme',
      'content',
      'plugins'
    ];
    
    const missingConfigs = requiredConfigs.filter(config => 
      !configContent.includes(config)
    );
    
    if (missingConfigs.length > 0) {
      log(`⚠️  Missing Tailwind configs: ${missingConfigs.join(', ')}`, 'warning');
    } else {
      log('✅ Tailwind configuration is complete', 'success');
    }
    
    // Check for dark mode configuration
    if (configContent.includes('darkMode')) {
      log('✅ Dark mode is configured', 'success');
    } else {
      log('⚠️  Dark mode not configured', 'warning');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error reading Tailwind config: ${error.message}`, 'error');
    return false;
  }
}

function validateComponentsConfig() {
  log('🔍 Validating components configuration...', 'info');
  
  const configPath = 'components.json';
  if (!checkFileExists(configPath)) {
    log('⚠️  Components configuration file not found', 'warning');
    return false;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for essential component configurations
    const requiredConfigs = [
      'style',
      'tailwind',
      'components'
    ];
    
    const missingConfigs = requiredConfigs.filter(config => 
      !configContent.includes(config)
    );
    
    if (missingConfigs.length > 0) {
      log(`⚠️  Components configuration may be incomplete`, 'warning');
    } else {
      log('✅ Components configuration is complete', 'success');
    }
    
    return true;
  } catch (error) {
    log(`⚠️  Error reading components config: ${error.message}`, 'warning');
    return false;
  }
}

function validateCSSFile() {
  log('🔍 Validating CSS file...', 'info');
  
  const cssPath = 'public/src/index.css';
  if (!checkFileExists(cssPath)) {
    log('❌ CSS file not found', 'error');
    return false;
  }
  
  try {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for Tailwind imports
    if (cssContent.includes('@tailwind')) {
      log('✅ CSS imports are complete', 'success');
    } else {
      log('⚠️  Tailwind imports may be missing', 'warning');
    }
    
    // Check for CSS variables
    if (cssContent.includes('--') || cssContent.includes('var(')) {
      log('✅ CSS variables are defined', 'success');
    } else {
      log('⚠️  No CSS variables found', 'warning');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error reading CSS file: ${error.message}`, 'error');
    return false;
  }
}

function validateThemeToggle() {
  log('🔍 Validating theme toggle component...', 'info');
  
  const togglePath = 'public/src/components/theme-toggle.tsx';
  if (!checkFileExists(togglePath)) {
    log('❌ Theme toggle component not found', 'error');
    return false;
  }
  
  try {
    const toggleContent = fs.readFileSync(togglePath, 'utf8');
    
    // Check for essential theme toggle functionality
    const requiredFeatures = [
      'useTheme',
      'setTheme',
      'theme',
      'toggle'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => 
      !toggleContent.includes(feature)
    );
    
    if (missingFeatures.length > 0) {
      log(`⚠️  Theme toggle may be missing features: ${missingFeatures.join(', ')}`, 'warning');
    } else {
      log('✅ Theme toggle component is complete', 'success');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error reading theme toggle: ${error.message}`, 'error');
    return false;
  }
}

function scanComponentsForThemeClasses() {
  log('🔍 Scanning for theme classes in components...', 'info');
  
  let hasIssues = false;
  
  MAIN_COMPONENTS.forEach(componentPath => {
    if (!checkFileExists(componentPath)) {
      log(`⚠️  Component not found: ${componentPath}`, 'warning');
      return;
    }
    
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      const hasLightClasses = EXPECTED_THEME_CLASSES.light.some(cls => content.includes(cls));
      const hasDarkClasses = EXPECTED_THEME_CLASSES.dark.some(cls => content.includes(cls));
      
      if (hasLightClasses && !hasDarkClasses) {
        log(`⚠️  ${path.basename(componentPath)}: Has light classes but no dark classes`, 'warning');
        hasIssues = true;
      } else if (hasLightClasses && hasDarkClasses) {
        log(`✅ ${path.basename(componentPath)}: Has both light and dark classes`, 'success');
      } else if (!hasLightClasses && !hasDarkClasses) {
        log(`⚠️  ${path.basename(componentPath)}: No theme classes found`, 'warning');
        hasIssues = true;
      }
    } catch (error) {
      log(`❌ Error reading ${componentPath}: ${error.message}`, 'error');
      hasIssues = true;
    }
  });
  
  return !hasIssues;
}

function validateThemeConsistency() {
  log('🔍 Validating theme consistency...', 'info');
  
  // Check if theme provider is configured
  const appPath = 'public/src/App.tsx';
  if (checkFileExists(appPath)) {
    try {
      const appContent = fs.readFileSync(appPath, 'utf8');
      if (appContent.includes('ThemeProvider') || appContent.includes('useTheme')) {
        log('✅ Theme provider is configured', 'success');
      } else {
        log('⚠️  Theme provider may not be configured', 'warning');
      }
    } catch (error) {
      log(`⚠️  Could not check App.tsx: ${error.message}`, 'warning');
    }
  }
  
  // Check if theme toggle is included in main App
  const mainPath = 'public/src/main.tsx';
  if (checkFileExists(mainPath)) {
    try {
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      if (mainContent.includes('ThemeProvider') || mainContent.includes('theme-toggle')) {
        log('✅ Theme toggle is included in main App', 'success');
      } else {
        log('⚠️  Theme toggle may not be included in main App', 'warning');
      }
    } catch (error) {
      log(`⚠️  Could not check main.tsx: ${error.message}`, 'warning');
    }
  }
  
  return true;
}

function main() {
  console.log('🎨 Starting theme validation...\n');
  
  let allValid = true;
  
  // Validate Tailwind configuration
  if (!validateTailwindConfig()) {
    allValid = false;
  }
  console.log('');
  
  // Validate components configuration
  if (!validateComponentsConfig()) {
    allValid = false;
  }
  console.log('');
  
  // Validate CSS file
  if (!validateCSSFile()) {
    allValid = false;
  }
  console.log('');
  
  // Validate theme toggle component
  if (!validateThemeToggle()) {
    allValid = false;
  }
  console.log('');
  
  // Scan components for theme classes
  if (!scanComponentsForThemeClasses()) {
    allValid = false;
  }
  console.log('');
  
  // Validate theme consistency
  if (!validateThemeConsistency()) {
    allValid = false;
  }
  console.log('');
  
  if (allValid) {
    log('✅ Theme validation completed successfully!', 'success');
  } else {
    log('❌ Theme validation found issues that should be addressed', 'error');
    log('⚠️  Please review the warnings and errors above', 'warning');
  }
}

// Run the validation
main();
