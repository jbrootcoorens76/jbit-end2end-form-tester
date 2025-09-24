#!/usr/bin/env node

/**
 * JBIT Test Runner
 *
 * Specialized test runner for JBIT customer tests.
 * Sets up environment, handles reCAPTCHA bypass, and ensures
 * test results go to the correct customer directory.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class JBITTestRunner {
  constructor() {
    this.customer = 'jbit';
    this.rootDir = __dirname;
    this.customerDir = path.join(this.rootDir, 'customers', this.customer);
    this.reportsDir = path.join(this.customerDir, 'reports');
  }

  /**
   * Setup environment for JBIT tests
   */
  async setupEnvironment() {
    console.log('Setting up JBIT test environment...');

    // Ensure reports directory exists
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      await fs.mkdir(path.join(this.reportsDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.reportsDir, 'test-artifacts'), { recursive: true });
      await fs.mkdir(path.join(this.reportsDir, 'html-report'), { recursive: true });
      console.log(`Created reports directory: ${this.reportsDir}`);
    } catch (error) {
      console.error('Error creating reports directory:', error);
    }

    // Set environment variables for customer-specific execution
    process.env.CUSTOMER = this.customer;
    process.env.NODE_ENV = 'test';
    process.env.BYPASS_RECAPTCHA = 'true';
    process.env.TESTING = 'true';

    // Configure Playwright-specific environment
    process.env.PLAYWRIGHT_HTML_REPORT = path.join(this.reportsDir, 'html-report');
    process.env.PLAYWRIGHT_JSON_REPORT = path.join(this.reportsDir, 'test-results.json');

    console.log('Environment variables set:');
    console.log(`  CUSTOMER=${process.env.CUSTOMER}`);
    console.log(`  NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`  BYPASS_RECAPTCHA=${process.env.BYPASS_RECAPTCHA}`);
    console.log(`  Reports will be saved to: ${this.reportsDir}`);
  }

  /**
   * Run JBIT tests with proper configuration
   * @param {Array} testArgs - Additional test arguments
   */
  async runTests(testArgs = []) {
    await this.setupEnvironment();

    console.log('\n=== Starting JBIT Form Tests ===\n');

    // Build Playwright command
    const playwrightCmd = 'npx';
    const playwrightArgs = [
      'playwright',
      'test',
      // Specify customer test directory
      path.join('customers', this.customer, 'tests'),
      // Add configuration overrides
      ...testArgs
    ];

    console.log(`Running: ${playwrightCmd} ${playwrightArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const testProcess = spawn(playwrightCmd, playwrightArgs, {
        cwd: this.rootDir,
        env: process.env,
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        console.log(`\n=== Tests completed with code: ${code} ===`);
        console.log(`\nTest results available at: ${this.reportsDir}`);

        if (code === 0) {
          this.showResultsSummary();
          resolve(code);
        } else {
          console.error('Some tests failed. Check the reports for details.');
          this.showFailureGuidance();
          resolve(code); // Don't reject, just return the exit code
        }
      });

      testProcess.on('error', (error) => {
        console.error('Failed to start test process:', error);
        reject(error);
      });
    });
  }

  /**
   * Show test results summary
   */
  showResultsSummary() {
    console.log('\n📊 Test Results Summary:');
    console.log(`   📁 HTML Report: ${path.join(this.reportsDir, 'html-report', 'index.html')}`);
    console.log(`   📋 JSON Report: ${path.join(this.reportsDir, 'test-results.json')}`);
    console.log(`   📸 Screenshots: ${path.join(this.reportsDir, 'screenshots')}`);
    console.log(`   🎥 Videos: ${path.join(this.reportsDir, 'test-artifacts')}`);

    console.log('\n✅ To view the HTML report:');
    console.log(`   npx playwright show-report "${path.join(this.reportsDir, 'html-report')}"`);
  }

  /**
   * Show guidance for test failures
   */
  showFailureGuidance() {
    console.log('\n🔧 Test Failure Guidance:');
    console.log('\nIf tests are failing due to reCAPTCHA issues:');
    console.log('   1. The reCAPTCHA bypass strategies are automatically applied');
    console.log('   2. Check if the form structure has changed on the website');
    console.log('   3. Review screenshots in the reports directory for visual debugging');
    console.log('   4. Consider updating selectors in forms-list.json if elements changed');

    console.log('\nCommon reCAPTCHA bypass strategies being used:');
    console.log('   ✓ Network request interception');
    console.log('   ✓ JavaScript object mocking');
    console.log('   ✓ Script blocking');
    console.log('   ✓ Direct API submission simulation');

    console.log('\nFor debugging:');
    console.log('   - Run with --headed to see browser behavior');
    console.log('   - Add --debug to enable step-by-step debugging');
    console.log('   - Check console output for reCAPTCHA bypass logs');
  }

  /**
   * Run specific test scenarios
   * @param {string} scenario - Test scenario to run
   */
  async runScenario(scenario) {
    const scenarioTests = {
      'happy-path': ['--grep', 'TC-001|Should submit.*successfully'],
      'validation': ['--grep', 'validation|TC-00[2-4]'],
      'recaptcha': ['--grep', 'submit|TC-001'],
      'all': []
    };

    const testArgs = scenarioTests[scenario] || scenarioTests['all'];
    console.log(`Running ${scenario} scenario...`);

    return await this.runTests(testArgs);
  }
}

// CLI interface
async function main() {
  const runner = new JBITTestRunner();
  const args = process.argv.slice(2);

  try {
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
JBIT Test Runner

Usage:
  node run-jbit-tests.js [scenario] [options]

Scenarios:
  happy-path    Run basic form submission tests
  validation    Run form validation tests
  recaptcha     Run reCAPTCHA-focused tests
  all          Run all tests (default)

Examples:
  node run-jbit-tests.js                    # Run all tests
  node run-jbit-tests.js happy-path         # Run happy path tests
  node run-jbit-tests.js --headed           # Run with visible browser
  node run-jbit-tests.js --debug            # Run with debugging

Environment Variables:
  HEADLESS=false      Show browser during tests
  SLOW_MO=1000       Add delay between actions (ms)
  TEST_TIMEOUT=60000  Set test timeout (ms)
  SCREENSHOTS=false   Disable screenshots
  VIDEOS=true         Enable video recording

The reCAPTCHA bypass is automatically applied for all test scenarios.
      `);
      return 0;
    }

    const scenario = args.find(arg => !arg.startsWith('--')) || 'all';
    const playwrightArgs = args.filter(arg => arg.startsWith('--'));

    const exitCode = await runner.runScenario(scenario);
    process.exit(exitCode);

  } catch (error) {
    console.error('Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = JBITTestRunner;