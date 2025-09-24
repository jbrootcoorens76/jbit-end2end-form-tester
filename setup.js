#!/usr/bin/env node

/**
 * Setup script for JBIT Form Testing
 * Prepares the environment for running Playwright tests
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up JBIT End-to-End Form Testing...\n');

/**
 * Create necessary directories
 */
function createDirectories() {
  console.log('📁 Creating directories...');

  const dirs = [
    'test-results',
    'test-results/screenshots',
    'playwright-report',
    'screenshots'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`   Created: ${dir}`);
    } else {
      console.log(`   Exists: ${dir}`);
    }
  });
}

/**
 * Create .env file from template if it doesn't exist
 */
function createEnvFile() {
  console.log('\n🔧 Setting up environment...');

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('   Created .env file from .env.example');
    console.log('   You can customize the .env file for your environment');
  } else if (fs.existsSync(envPath)) {
    console.log('   .env file already exists');
  } else {
    console.log('   ⚠️  .env.example not found, skipping .env creation');
  }
}

/**
 * Verify test data files exist
 */
function verifyTestData() {
  console.log('\n📋 Verifying test data...');

  const requiredFiles = [
    'customers/jbit/forms/forms-list.json',
    'customers/jbit/forms/test-cases.md',
    'customers/jbit/data/test-data.json'
  ];

  let allFilesExist = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    console.log('\n   ⚠️  Some test data files are missing.');
    console.log('   Please ensure Phase 1 outputs are in place before running tests.');
  }

  return allFilesExist;
}

/**
 * Display setup completion and next steps
 */
function displayNextSteps() {
  console.log('\n✅ Setup completed!\n');
  console.log('Next steps:');
  console.log('1. Install dependencies:');
  console.log('   npm install');
  console.log('\n2. Install Playwright browsers:');
  console.log('   npm run install:browsers');
  console.log('\n3. Run the tests:');
  console.log('   npm test                    # Run all tests');
  console.log('   npm run test:contact        # Run JBIT contact form tests only');
  console.log('   npm run test:headed         # Run tests in headed mode (see browser)');
  console.log('   npm run test:debug          # Run tests in debug mode');
  console.log('\n4. View test reports:');
  console.log('   npm run report              # Open HTML test report');
  console.log('\n📖 Test Coverage:');
  console.log('   ✓ 11 main test scenarios from test-cases.md');
  console.log('   ✓ 2 bonus edge case tests');
  console.log('   ✓ Dutch language validation messages');
  console.log('   ✓ Form interaction patterns');
  console.log('   ✓ Error recovery workflows');

  const currentDir = process.cwd();
  const projectDir = __dirname;

  if (currentDir !== projectDir) {
    console.log(`\n📍 Make sure to cd into the project directory:`);
    console.log(`   cd "${projectDir}"`);
  }
}

/**
 * Main setup function
 */
function main() {
  try {
    createDirectories();
    createEnvFile();
    const hasAllFiles = verifyTestData();

    displayNextSteps();

    if (!hasAllFiles) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createDirectories,
  createEnvFile,
  verifyTestData,
  main
};