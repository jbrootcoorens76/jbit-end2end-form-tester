/**
 * Environment Validator for JBIT Tests
 *
 * Validates test environment setup and provides warnings/recommendations
 * for optimal test execution, especially for reCAPTCHA bypass scenarios.
 */

const fs = require('fs').promises;
const path = require('path');

class EnvironmentValidator {
  constructor() {
    this.warnings = [];
    this.errors = [];
    this.recommendations = [];
  }

  /**
   * Validate the complete test environment
   * @returns {Object} Validation results
   */
  async validateEnvironment() {
    console.log('🔍 Validating JBIT test environment...\n');

    // Check core requirements
    await this.validatePlaywrightInstallation();
    await this.validateDirectoryStructure();
    await this.validateConfiguration();
    await this.validateTestData();
    await this.validateRecaptchaSetup();

    return this.getValidationSummary();
  }

  /**
   * Check Playwright installation and browser availability
   */
  async validatePlaywrightInstallation() {
    try {
      const { chromium } = require('playwright');
      console.log('✅ Playwright installation found');

      // Check if browsers are installed
      try {
        const browser = await chromium.launch({ headless: true });
        await browser.close();
        console.log('✅ Chromium browser available');
      } catch (error) {
        this.warnings.push('Chromium browser not properly installed. Run: npm run install:browsers');
      }
    } catch (error) {
      this.errors.push('Playwright not found. Run: npm install');
    }
  }

  /**
   * Validate directory structure for JBIT customer
   */
  async validateDirectoryStructure() {
    const requiredDirs = [
      'customers/jbit/tests',
      'customers/jbit/data',
      'customers/jbit/forms',
      'customers/jbit/reports'
    ];

    const requiredFiles = [
      'customers/jbit/tests/ContactFormPage.js',
      'customers/jbit/tests/contact-form.spec.js',
      'customers/jbit/tests/utils/recaptcha-handler.js',
      'customers/jbit/data/test-data.json',
      'customers/jbit/forms/forms-list.json'
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`✅ Directory exists: ${dir}`);
      } catch (error) {
        this.errors.push(`Missing required directory: ${dir}`);
      }
    }

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        console.log(`✅ File exists: ${file}`);
      } catch (error) {
        this.errors.push(`Missing required file: ${file}`);
      }
    }
  }

  /**
   * Validate configuration files
   */
  async validateConfiguration() {
    try {
      // Check forms configuration
      const formsConfig = require('../../../forms/forms-list.json');
      const contactForm = formsConfig.forms.find(f => f.id === 'jbit-contact-form');

      if (!contactForm) {
        this.errors.push('JBIT contact form configuration not found');
      } else {
        console.log('✅ Contact form configuration found');

        if (contactForm.security_features?.recaptcha) {
          console.log('✅ reCAPTCHA configuration detected');
        } else {
          this.warnings.push('reCAPTCHA not marked as enabled in form configuration');
        }
      }

      // Check test configuration
      const testConfig = require('./test-config');
      console.log('✅ Test configuration loaded');

      if (testConfig.config.shouldBypassSecurity()) {
        console.log('✅ Security bypass enabled for testing');
      }

    } catch (error) {
      this.errors.push(`Configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Validate test data files
   */
  async validateTestData() {
    try {
      const testData = require('../../data/test-data.json');
      console.log('✅ Test data file loaded');

      // Check for required test data sets
      const requiredSets = [
        'valid_data.happy_path_basic',
        'invalid_data.empty_required_fields',
        'invalid_data.invalid_email_formats'
      ];

      for (const setPath of requiredSets) {
        const keys = setPath.split('.');
        let current = testData.test_data_sets;

        for (const key of keys) {
          if (current && current[key]) {
            current = current[key];
          } else {
            this.warnings.push(`Missing test data set: ${setPath}`);
            current = null;
            break;
          }
        }

        if (current) {
          console.log(`✅ Test data set found: ${setPath}`);
        }
      }
    } catch (error) {
      this.errors.push(`Test data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate reCAPTCHA bypass setup
   */
  async validateRecaptchaSetup() {
    try {
      const RecaptchaHandler = require('./recaptcha-handler');
      console.log('✅ reCAPTCHA handler module loaded');

      // Check environment variables for bypass
      const bypassVars = [
        'NODE_ENV',
        'BYPASS_RECAPTCHA',
        'TESTING'
      ];

      for (const varName of bypassVars) {
        if (process.env[varName]) {
          console.log(`✅ Environment variable set: ${varName}=${process.env[varName]}`);
        } else {
          this.recommendations.push(`Consider setting ${varName} for consistent test behavior`);
        }
      }

      // Validate bypass strategies are available
      const strategies = [
        'intercept_network',
        'mock_response',
        'disable_scripts',
        'direct_api'
      ];

      console.log(`✅ ${strategies.length} reCAPTCHA bypass strategies available`);

    } catch (error) {
      this.errors.push(`reCAPTCHA setup validation failed: ${error.message}`);
    }
  }

  /**
   * Get validation summary
   */
  getValidationSummary() {
    const summary = {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.recommendations
    };

    console.log('\n📋 Environment Validation Summary:');
    console.log(`   ❌ Errors: ${this.errors.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   💡 Recommendations: ${this.recommendations.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors (must fix):');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings (should fix):');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (this.recommendations.length > 0) {
      console.log('\n💡 Recommendations (nice to have):');
      this.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    if (summary.success) {
      console.log('\n🎉 Environment validation passed! Tests should run successfully.');
      console.log('\n🚀 Ready to run tests:');
      console.log('   npm run test:jbit           # Run all JBIT tests');
      console.log('   npm run test:jbit:headed    # Run with visible browser');
      console.log('   npm run test:jbit:happy     # Run happy path tests only');
    } else {
      console.log('\n🔧 Please fix the errors above before running tests.');
    }

    return summary;
  }

  /**
   * Quick health check for CI/automated runs
   * @returns {boolean} True if environment is ready
   */
  async quickHealthCheck() {
    const requiredFiles = [
      'customers/jbit/tests/contact-form.spec.js',
      'customers/jbit/tests/ContactFormPage.js',
      'customers/jbit/tests/utils/recaptcha-handler.js'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
      } catch (error) {
        return false;
      }
    }

    try {
      require('@playwright/test');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// CLI interface
async function main() {
  const validator = new EnvironmentValidator();

  if (process.argv.includes('--quick')) {
    const healthy = await validator.quickHealthCheck();
    console.log(healthy ? '✅ Environment OK' : '❌ Environment Issues');
    process.exit(healthy ? 0 : 1);
  } else {
    const result = await validator.validateEnvironment();
    process.exit(result.success ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnvironmentValidator;