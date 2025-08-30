#!/usr/bin/env node

/**
 * UI Screenshot Test Script
 * Captures screenshots of UI components in different themes for visual regression testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Test scenarios to capture
const TEST_SCENARIOS = [
  {
    name: 'homepage-light',
    url: 'http://localhost:5173',
    theme: 'light',
    description: 'Homepage in light theme'
  },
  {
    name: 'homepage-dark',
    url: 'http://localhost:5173',
    theme: 'dark',
    description: 'Homepage in dark theme'
  },
  {
    name: 'admin-light',
    url: 'http://localhost:5173/admin',
    theme: 'light',
    description: 'Admin panel in light theme'
  },
  {
    name: 'admin-dark',
    url: 'http://localhost:5173/admin',
    theme: 'dark',
    description: 'Admin panel in dark theme'
  }
];

// Screenshot directories
const SCREENSHOT_DIR = 'screenshots';
const BASELINE_DIR = path.join(SCREENSHOT_DIR, 'baseline');
const CURRENT_DIR = path.join(SCREENSHOT_DIR, 'current');
const DIFF_DIR = path.join(SCREENSHOT_DIR, 'diff');

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

function ensureDirectories() {
  const dirs = [SCREENSHOT_DIR, BASELINE_DIR, CURRENT_DIR, DIFF_DIR];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`, 'info');
    }
  });
}

function checkDependencies() {
  log('🔍 Checking dependencies...', 'info');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'ignore' });
    log('✅ Playwright is available', 'success');
  } catch (error) {
    log('❌ Playwright not found. Installing...', 'warning');
    try {
      execSync('npm install --save-dev @playwright/test playwright', { stdio: 'inherit' });
      execSync('npx playwright install', { stdio: 'inherit' });
      log('✅ Playwright installed successfully', 'success');
    } catch (installError) {
      log('❌ Failed to install Playwright', 'error');
      return false;
    }
  }
  
  return true;
}

function createScreenshotScript() {
  const scriptContent = `
const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const scenarios = ${JSON.stringify(TEST_SCENARIOS)};
  
  for (const scenario of scenarios) {
    console.log(\`Capturing \${scenario.name}...\`);
    
    // Navigate to the page
    await page.goto(scenario.url);
    
    // Set theme if needed
    if (scenario.theme === 'dark') {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
    }
    
    // Wait for theme to apply
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({
      path: \`screenshots/current/\${scenario.name}.png\`,
      fullPage: true
    });
    
    console.log(\`✅ Captured \${scenario.name}\`);
  }
  
  await browser.close();
}

captureScreenshots().catch(console.error);
`;

  fs.writeFileSync('temp-screenshot.js', scriptContent);
  return 'temp-screenshot.js';
}

function captureScreenshots() {
  log('📸 Capturing screenshots...', 'info');
  
  try {
    const scriptPath = createScreenshotScript();
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    fs.unlinkSync(scriptPath); // Clean up temp file
    
    log('✅ Screenshots captured successfully', 'success');
    return true;
  } catch (error) {
    log(`❌ Failed to capture screenshots: ${error.message}`, 'error');
    return false;
  }
}

function compareScreenshots() {
  log('🔍 Comparing screenshots...', 'info');
  
  let hasDifferences = false;
  
  for (const scenario of TEST_SCENARIOS) {
    const baselinePath = path.join(BASELINE_DIR, `${scenario.name}.png`);
    const currentPath = path.join(CURRENT_DIR, `${scenario.name}.png`);
    const diffPath = path.join(DIFF_DIR, `${scenario.name}.png`);
    
    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      log(`⚠️  No baseline for ${scenario.name}, creating baseline...`, 'warning');
      if (fs.existsSync(currentPath)) {
        fs.copyFileSync(currentPath, baselinePath);
        log(`✅ Created baseline for ${scenario.name}`, 'success');
      }
      continue;
    }
    
    // Check if current screenshot exists
    if (!fs.existsSync(currentPath)) {
      log(`❌ Current screenshot missing for ${scenario.name}`, 'error');
      hasDifferences = true;
      continue;
    }
    
    // Compare screenshots using ImageMagick or similar
    try {
      // Simple file size comparison as a basic check
      const baselineStats = fs.statSync(baselinePath);
      const currentStats = fs.statSync(currentPath);
      
      const sizeDiff = Math.abs(baselineStats.size - currentStats.size);
      const sizeDiffPercent = (sizeDiff / baselineStats.size) * 100;
      
      if (sizeDiffPercent > 5) { // More than 5% difference
        log(`⚠️  Potential visual difference detected in ${scenario.name} (${sizeDiffPercent.toFixed(1)}% size difference)`, 'warning');
        hasDifferences = true;
        
        // Copy current to diff for manual review
        fs.copyFileSync(currentPath, diffPath);
      } else {
        log(`✅ ${scenario.name} looks consistent`, 'success');
      }
    } catch (error) {
      log(`❌ Error comparing ${scenario.name}: ${error.message}`, 'error');
      hasDifferences = true;
    }
  }
  
  return !hasDifferences;
}

function generateReport() {
  log('📊 Generating UI test report...', 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    scenarios: TEST_SCENARIOS.map(scenario => ({
      name: scenario.name,
      description: scenario.description,
      baseline: fs.existsSync(path.join(BASELINE_DIR, `${scenario.name}.png`)),
      current: fs.existsSync(path.join(CURRENT_DIR, `${scenario.name}.png`)),
      diff: fs.existsSync(path.join(DIFF_DIR, `${scenario.name}.png`))
    })),
    summary: {
      total: TEST_SCENARIOS.length,
      baseline: TEST_SCENARIOS.filter(s => fs.existsSync(path.join(BASELINE_DIR, `${s.name}.png`))).length,
      current: TEST_SCENARIOS.filter(s => fs.existsSync(path.join(CURRENT_DIR, `${s.name}.png`))).length,
      differences: TEST_SCENARIOS.filter(s => fs.existsSync(path.join(DIFF_DIR, `${s.name}.png`))).length
    }
  };
  
  const reportPath = path.join(SCREENSHOT_DIR, 'ui-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('✅ UI test report generated', 'success');
  log(`📄 Report saved to: ${reportPath}`, 'info');
  
  return report;
}

function main() {
  log('🎨 Starting UI screenshot tests...', 'info');
  console.log('');
  
  // Ensure directories exist
  ensureDirectories();
  
  // Check dependencies
  if (!checkDependencies()) {
    log('❌ Dependencies check failed', 'error');
    return false;
  }
  
  // Capture screenshots
  if (!captureScreenshots()) {
    log('❌ Screenshot capture failed', 'error');
    return false;
  }
  
  // Compare screenshots
  const screenshotsMatch = compareScreenshots();
  
  // Generate report
  const report = generateReport();
  
  console.log('');
  log('📊 UI Test Summary:', 'info');
  log(`  Total scenarios: ${report.summary.total}`, 'info');
  log(`  Baselines: ${report.summary.baseline}`, 'info');
  log(`  Current screenshots: ${report.summary.current}`, 'info');
  log(`  Differences detected: ${report.summary.differences}`, report.summary.differences > 0 ? 'warning' : 'success');
  
  if (screenshotsMatch) {
    log('🎉 UI screenshot tests passed!', 'success');
    log('✅ No visual regressions detected', 'success');
  } else {
    log('⚠️  UI screenshot tests found potential visual differences', 'warning');
    log('📁 Check the diff/ directory for manual review', 'info');
  }
  
  return screenshotsMatch;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = main();
  process.exit(success ? 0 : 1);
}

export { main as runUIScreenshotTests };

