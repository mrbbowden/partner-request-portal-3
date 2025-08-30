#!/usr/bin/env node

/**
 * Automatic Theme Repair Script
 * Fixes common theme issues automatically
 */

import fs from 'fs';
import path from 'path';

// Common theme fixes
const THEME_FIXES = {
  // Add missing dark theme classes
  addDarkClasses: {
    'bg-white': 'bg-white dark:bg-gray-900',
    'text-gray-900': 'text-gray-900 dark:text-white',
    'border-gray-200': 'border-gray-200 dark:border-gray-700',
    'bg-gray-50': 'bg-gray-50 dark:bg-gray-800',
    'text-gray-600': 'text-gray-600 dark:text-gray-300',
    'bg-gray-100': 'bg-gray-100 dark:bg-gray-800',
    'hover:bg-gray-100': 'hover:bg-gray-100 dark:hover:bg-gray-800',
    'focus:ring-gray-500': 'focus:ring-gray-500 dark:focus:ring-gray-400'
  },
  
  // Add transition classes
  addTransitions: {
    'bg-white dark:bg-gray-900': 'bg-white dark:bg-gray-900 transition-colors duration-200',
    'text-gray-900 dark:text-white': 'text-gray-900 dark:text-white transition-colors duration-200',
    'border-gray-200 dark:border-gray-700': 'border-gray-200 dark:border-gray-700 transition-colors duration-200'
  },
  
  // Fix theme toggle component
  fixThemeToggle: {
    'import React': 'import React from "react";\nimport { useTheme } from "next-themes";\nimport { Moon, Sun } from "lucide-react";',
    'const ThemeToggle': 'const ThemeToggle = () => {\n  const { theme, setTheme } = useTheme();\n\n  return (\n    <button\n      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}\n      className="p-2 rounded-md transition-colors duration-200"\n    >\n      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}\n    </button>\n  );\n};'
  }
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

function backupFile(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  try {
    fs.copyFileSync(filePath, backupPath);
    log(`📁 Created backup: ${backupPath}`, 'info');
    return backupPath;
  } catch (error) {
    log(`❌ Failed to create backup for ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

function fixComponentTheme(componentPath) {
  const componentName = path.basename(componentPath);
  log(`🔧 Fixing theme for ${componentName}...`, 'info');
  
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    let fixedContent = content;
    let fixesApplied = 0;
    
    // Apply dark theme class fixes
    Object.entries(THEME_FIXES.addDarkClasses).forEach(([oldClass, newClass]) => {
      if (content.includes(oldClass) && !content.includes('dark:')) {
        fixedContent = fixedContent.replace(new RegExp(oldClass, 'g'), newClass);
        fixesApplied++;
      }
    });
    
    // Apply transition class fixes
    Object.entries(THEME_FIXES.addTransitions).forEach(([oldClass, newClass]) => {
      if (fixedContent.includes(oldClass) && !fixedContent.includes('transition-colors')) {
        fixedContent = fixedContent.replace(new RegExp(oldClass, 'g'), newClass);
        fixesApplied++;
      }
    });
    
    // Special fix for theme toggle component
    if (componentName === 'theme-toggle.tsx') {
      if (!content.includes('useTheme')) {
        fixedContent = THEME_FIXES.fixThemeToggle['import React'] + '\n\n' + 
                      THEME_FIXES.fixThemeToggle['const ThemeToggle'] + '\n\nexport default ThemeToggle;';
        fixesApplied++;
      }
    }
    
    if (fixesApplied > 0) {
      // Create backup before making changes
      backupFile(componentPath);
      
      // Write fixed content
      fs.writeFileSync(componentPath, fixedContent);
      log(`✅ Applied ${fixesApplied} fixes to ${componentName}`, 'success');
      return fixesApplied;
    } else {
      log(`ℹ️  No fixes needed for ${componentName}`, 'info');
      return 0;
    }
  } catch (error) {
    log(`❌ Error fixing ${componentName}: ${error.message}`, 'error');
    return 0;
  }
}

function fixTailwindConfig() {
  log('🔧 Checking Tailwind configuration...', 'info');
  
  const configPath = 'tailwind.config.ts';
  if (!fs.existsSync(configPath)) {
    log('❌ Tailwind config not found', 'error');
    return false;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    let fixedContent = content;
    let fixesApplied = 0;
    
    // Add dark mode if missing
    if (!content.includes('darkMode')) {
      fixedContent = fixedContent.replace(
        'module.exports = {',
        'module.exports = {\n  darkMode: "class",'
      );
      fixesApplied++;
    }
    
    // Add content paths if missing
    if (!content.includes('content:')) {
      fixedContent = fixedContent.replace(
        'module.exports = {',
        'module.exports = {\n  content: ["./public/**/*.{js,ts,jsx,tsx}"],'
      );
      fixesApplied++;
    }
    
    if (fixesApplied > 0) {
      backupFile(configPath);
      fs.writeFileSync(configPath, fixedContent);
      log(`✅ Applied ${fixesApplied} fixes to Tailwind config`, 'success');
      return true;
    } else {
      log('ℹ️  Tailwind config is already correct', 'info');
      return true;
    }
  } catch (error) {
    log(`❌ Error fixing Tailwind config: ${error.message}`, 'error');
    return false;
  }
}

function fixCSSFile() {
  log('🔧 Checking CSS file...', 'info');
  
  const cssPath = 'public/src/index.css';
  if (!fs.existsSync(cssPath)) {
    log('❌ CSS file not found', 'error');
    return false;
  }
  
  try {
    const content = fs.readFileSync(cssPath, 'utf8');
    let fixedContent = content;
    let fixesApplied = 0;
    
    // Add missing Tailwind imports
    if (!content.includes('@tailwind base')) {
      fixedContent = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n' + fixedContent;
      fixesApplied++;
    }
    
    // Add CSS variables if missing
    if (!content.includes('--background')) {
      const cssVariables = `
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}`;
      fixedContent += cssVariables;
      fixesApplied++;
    }
    
    if (fixesApplied > 0) {
      backupFile(cssPath);
      fs.writeFileSync(cssPath, fixedContent);
      log(`✅ Applied ${fixesApplied} fixes to CSS file`, 'success');
      return true;
    } else {
      log('ℹ️  CSS file is already correct', 'info');
      return true;
    }
  } catch (error) {
    log(`❌ Error fixing CSS file: ${error.message}`, 'error');
    return false;
  }
}

function fixAppTheme() {
  log('🔧 Checking main App component...', 'info');
  
  const appPath = 'public/src/App.tsx';
  if (!fs.existsSync(appPath)) {
    log('❌ App component not found', 'error');
    return false;
  }
  
  try {
    const content = fs.readFileSync(appPath, 'utf8');
    let fixedContent = content;
    let fixesApplied = 0;
    
    // Add theme provider if missing
    if (!content.includes('ThemeProvider') && !content.includes('next-themes')) {
      const themeProviderImport = 'import { ThemeProvider } from "next-themes";\n';
      const themeProviderWrapper = '<ThemeProvider attribute="class" defaultTheme="system" enableSystem>\n      <div className="min-h-screen">\n        <Switch>\n          <Route path="/" component={HomePage} />\n          <Route path="/admin" component={AdminPage} />\n        </Switch>\n      </div>\n      <Toaster />\n      <ThemeToggle />\n    </ThemeProvider>';
      
      fixedContent = fixedContent.replace(
        /import React from 'react';/,
        `import React from 'react';\n${themeProviderImport}`
      );
      
      fixedContent = fixedContent.replace(
        /<div className="min-h-screen">[\s\S]*?<\/div>\s*<Toaster \/>\s*<ThemeToggle \/>/,
        themeProviderWrapper
      );
      
      fixesApplied++;
    }
    
    if (fixesApplied > 0) {
      backupFile(appPath);
      fs.writeFileSync(appPath, fixedContent);
      log(`✅ Applied ${fixesApplied} fixes to App component`, 'success');
      return true;
    } else {
      log('ℹ️  App component is already correct', 'info');
      return true;
    }
  } catch (error) {
    log(`❌ Error fixing App component: ${error.message}`, 'error');
    return false;
  }
}

function fixAllComponents() {
  log('🔧 Fixing all components...', 'info');
  
  const componentsDir = 'public/src/components';
  if (!fs.existsSync(componentsDir)) {
    log('❌ Components directory not found', 'error');
    return 0;
  }
  
  const files = fs.readdirSync(componentsDir);
  const tsxFiles = files.filter(file => file.endsWith('.tsx'));
  
  let totalFixes = 0;
  
  for (const file of tsxFiles) {
    const componentPath = path.join(componentsDir, file);
    const fixes = fixComponentTheme(componentPath);
    totalFixes += fixes;
  }
  
  return totalFixes;
}

function main() {
  log('🔧 Starting automatic theme repair...', 'info');
  console.log('');
  
  let totalFixes = 0;
  
  // Fix configuration files
  if (fixTailwindConfig()) totalFixes++;
  if (fixCSSFile()) totalFixes++;
  if (fixAppTheme()) totalFixes++;
  
  // Fix components
  const componentFixes = fixAllComponents();
  totalFixes += componentFixes;
  
  console.log('');
  log('📊 Theme Repair Summary:', 'info');
  log(`  Configuration fixes: 3 files checked`, 'info');
  log(`  Component fixes: ${componentFixes} fixes applied`, componentFixes > 0 ? 'success' : 'info');
  log(`  Total fixes applied: ${totalFixes}`, totalFixes > 0 ? 'success' : 'info');
  
  if (totalFixes > 0) {
    log('✅ Theme repair completed successfully!', 'success');
    log('🔄 Please run theme validation to verify fixes:', 'info');
    log('   npm run validate:theme', 'info');
  } else {
    log('ℹ️  No theme fixes were needed', 'info');
  }
  
  return totalFixes > 0;
}

// Run repair if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = main();
  process.exit(success ? 0 : 1);
}

export { main as fixTheme };

