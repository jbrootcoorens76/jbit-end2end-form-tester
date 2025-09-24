/**
 * JBIT Test Configuration
 *
 * Customer-specific configuration for JBIT form testing.
 * Handles environment settings, reCAPTCHA bypass configurations,
 * and test-specific parameters.
 */

const path = require('path');

class JBITTestConfig {
  constructor() {
    this.customer = 'jbit';
    this.environment = process.env.NODE_ENV || 'test';
    this.baseUrl = 'https://jbit.be';

    // Customer-specific paths
    this.paths = {
      reports: path.join(__dirname, '../../../reports'),
      screenshots: path.join(__dirname, '../../../reports/screenshots'),
      testData: path.join(__dirname, '../../data'),
      forms: path.join(__dirname, '../../forms')
    };

    // reCAPTCHA configuration
    this.recaptcha = {
      enabled: true,
      type: 'v2_invisible',
      bypassStrategies: [
        'intercept_network',
        'mock_response',
        'disable_scripts',
        'direct_api'
      ],
      testMode: {
        enabled: true,
        parameters: {
          'test_mode': 'true',
          'bypass_recaptcha': 'true',
          'testing': '1'
        }
      }
    };

    // Form configurations
    this.forms = {
      contact: {
        url: '/contact-nl/',
        language: 'nl',
        hasRecaptcha: true,
        timeout: 30000,
        retries: 3
      }
    };

    // Test environment settings
    this.testSettings = {
      headless: process.env.HEADLESS !== 'false',
      slowMo: parseInt(process.env.SLOW_MO) || 0,
      timeout: parseInt(process.env.TEST_TIMEOUT) || 60000,
      retries: parseInt(process.env.TEST_RETRIES) || 2,
      workers: parseInt(process.env.TEST_WORKERS) || 1,
      screenshots: process.env.SCREENSHOTS !== 'false',
      videos: process.env.VIDEOS === 'true'
    };

    // Expected messages in Dutch
    this.messages = {
      success: {
        primary: 'Bedankt voor uw bericht',
        alternative: ['Bericht verzonden', 'Succesvol verzonden']
      },
      errors: {
        general: 'Er is een fout opgetreden',
        required: ['Dit veld is verplicht', 'Vereist veld'],
        email: ['Voer een geldig emailadres in', 'Ongeldige email']
      }
    };
  }

  /**
   * Get full URL for a form
   * @param {string} formPath - Form path (e.g., '/contact-nl/')
   * @returns {string} - Complete URL
   */
  getFormUrl(formPath) {
    return `${this.baseUrl}${formPath}`;
  }

  /**
   * Get test environment configuration
   * @returns {Object} - Environment-specific settings
   */
  getEnvironmentConfig() {
    return {
      environment: this.environment,
      isTestMode: this.environment === 'test',
      baseUrl: this.baseUrl,
      ...this.testSettings
    };
  }

  /**
   * Get reCAPTCHA configuration for tests
   * @returns {Object} - reCAPTCHA settings and bypass options
   */
  getRecaptchaConfig() {
    return {
      ...this.recaptcha,
      shouldBypass: this.environment === 'test' || process.env.BYPASS_RECAPTCHA === 'true',
      testParameters: this.recaptcha.testMode.enabled ? this.recaptcha.testMode.parameters : {}
    };
  }

  /**
   * Get customer-specific output directories
   * @returns {Object} - Directory paths for test artifacts
   */
  getOutputPaths() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return {
      ...this.paths,
      currentRun: path.join(this.paths.reports, timestamp),
      screenshots: path.join(this.paths.screenshots, timestamp),
      htmlReports: path.join(this.paths.reports, 'html-report'),
      jsonReport: path.join(this.paths.reports, 'test-results.json')
    };
  }

  /**
   * Get form-specific configuration
   * @param {string} formName - Name of the form
   * @returns {Object} - Form configuration
   */
  getFormConfig(formName) {
    const formConfig = this.forms[formName];
    if (!formConfig) {
      throw new Error(`Unknown form: ${formName}`);
    }

    return {
      ...formConfig,
      fullUrl: this.getFormUrl(formConfig.url),
      recaptchaConfig: formConfig.hasRecaptcha ? this.getRecaptchaConfig() : null
    };
  }

  /**
   * Check if we're in a test environment that should bypass security
   * @returns {boolean} - True if security should be bypassed
   */
  shouldBypassSecurity() {
    return this.environment === 'test' ||
           process.env.BYPASS_SECURITY === 'true' ||
           process.env.CI === 'true' ||
           this.baseUrl.includes('test') ||
           this.baseUrl.includes('staging');
  }

  /**
   * Get Playwright configuration overrides for this customer
   * @returns {Object} - Playwright config overrides
   */
  getPlaywrightConfig() {
    const outputPaths = this.getOutputPaths();

    return {
      use: {
        baseURL: this.baseUrl,
        screenshot: this.testSettings.screenshots ? 'only-on-failure' : 'off',
        video: this.testSettings.videos ? 'retain-on-failure' : 'off',
        actionTimeout: this.testSettings.timeout / 6, // 1/6 of total timeout
        navigationTimeout: this.testSettings.timeout / 2, // 1/2 of total timeout
        trace: 'retain-on-failure'
      },
      timeout: this.testSettings.timeout,
      retries: this.testSettings.retries,
      workers: this.testSettings.workers,
      outputDir: outputPaths.currentRun,
      reporter: [
        ['html', {
          open: 'never',
          outputFolder: outputPaths.htmlReports
        }],
        ['json', {
          outputFile: outputPaths.jsonReport
        }],
        ['list']
      ]
    };
  }

  /**
   * Get test data configuration
   * @returns {Object} - Test data paths and settings
   */
  getTestDataConfig() {
    return {
      dataPath: this.paths.testData,
      language: 'nl',
      encoding: 'utf8',
      validationRules: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^(\+31|0)[0-9]{9,10}$/, // Dutch phone format
        required: ['naam', 'email', 'bericht'] // Dutch field names
      }
    };
  }
}

// Export singleton instance
const jbitConfig = new JBITTestConfig();

module.exports = {
  JBITTestConfig,
  config: jbitConfig
};