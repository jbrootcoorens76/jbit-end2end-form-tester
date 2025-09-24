/**
 * reCAPTCHA Handler Utility
 *
 * This module provides various strategies for handling reCAPTCHA in automated tests.
 * It implements multiple approaches to bypass or handle CAPTCHA protection for testing purposes.
 */

class RecaptchaHandler {
  constructor(page) {
    this.page = page;
    this.strategies = {
      DISABLE_SCRIPTS: 'disable_scripts',
      MOCK_RESPONSE: 'mock_response',
      INTERCEPT_NETWORK: 'intercept_network',
      ENVIRONMENT_BYPASS: 'environment_bypass',
      DIRECT_API: 'direct_api'
    };
  }

  /**
   * Main method to handle reCAPTCHA based on available strategies
   * @param {string} strategy - Strategy to use for bypassing reCAPTCHA
   * @returns {Promise<boolean>} - True if handled successfully
   */
  async handleRecaptcha(strategy = this.strategies.INTERCEPT_NETWORK) {
    console.log(`Attempting reCAPTCHA bypass using strategy: ${strategy}`);

    try {
      switch (strategy) {
        case this.strategies.DISABLE_SCRIPTS:
          return await this.disableRecaptchaScripts();
        case this.strategies.MOCK_RESPONSE:
          return await this.mockRecaptchaResponse();
        case this.strategies.INTERCEPT_NETWORK:
          return await this.interceptRecaptchaRequests();
        case this.strategies.ENVIRONMENT_BYPASS:
          return await this.environmentBypass();
        case this.strategies.DIRECT_API:
          return await this.directApiSubmission();
        default:
          console.warn(`Unknown strategy: ${strategy}. Using default intercept method.`);
          return await this.interceptRecaptchaRequests();
      }
    } catch (error) {
      console.error(`reCAPTCHA bypass failed with strategy ${strategy}:`, error);
      return false;
    }
  }

  /**
   * Strategy 1: Disable reCAPTCHA scripts from loading
   * Blocks Google reCAPTCHA scripts before they can initialize
   */
  async disableRecaptchaScripts() {
    await this.page.route('**/*recaptcha*', route => {
      console.log('Blocking reCAPTCHA script:', route.request().url());
      route.abort();
    });

    await this.page.route('**/*gstatic.com/recaptcha*', route => {
      console.log('Blocking reCAPTCHA resource:', route.request().url());
      route.abort();
    });

    await this.page.route('**/*google.com/recaptcha*', route => {
      console.log('Blocking reCAPTCHA API:', route.request().url());
      route.abort();
    });

    return true;
  }

  /**
   * Strategy 2: Mock successful reCAPTCHA response
   * Injects a mock grecaptcha object that always returns success
   */
  async mockRecaptchaResponse() {
    await this.page.addInitScript(() => {
      // Mock the grecaptcha object
      window.grecaptcha = {
        ready: (callback) => {
          if (typeof callback === 'function') {
            setTimeout(callback, 100);
          }
        },
        execute: () => {
          return Promise.resolve('mock_recaptcha_token_for_testing');
        },
        render: () => {
          return 'mock_widget_id';
        },
        getResponse: () => {
          return 'mock_recaptcha_response_for_testing';
        },
        reset: () => {
          // Mock reset function
        }
      };

      // Also handle reCAPTCHA callback if present
      if (window.onRecaptchaCallback) {
        setTimeout(() => {
          window.onRecaptchaCallback('mock_recaptcha_token_for_testing');
        }, 500);
      }
    });

    return true;
  }

  /**
   * Strategy 3: Intercept and modify reCAPTCHA network requests
   * Intercepts API calls and provides mock successful responses
   */
  async interceptRecaptchaRequests() {
    // Intercept reCAPTCHA verification requests
    await this.page.route('**/recaptcha/api/siteverify*', route => {
      console.log('Intercepting reCAPTCHA verification request');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          challenge_ts: new Date().toISOString(),
          hostname: new URL(this.page.url()).hostname,
          'error-codes': []
        })
      });
    });

    // Intercept reCAPTCHA token requests
    await this.page.route('**/recaptcha/api2/reload*', route => {
      console.log('Intercepting reCAPTCHA reload request');
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: 'mock_recaptcha_response_for_testing'
      });
    });

    // Mock the reCAPTCHA script loading
    await this.page.route('**/recaptcha/releases/*/recaptcha__*.js', route => {
      console.log('Mocking reCAPTCHA script');
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.grecaptcha = {
            ready: function(callback) {
              if(callback) setTimeout(callback, 100);
            },
            execute: function() {
              return Promise.resolve('mock_token_for_testing');
            },
            render: function() {
              return 'mock_widget';
            },
            getResponse: function() {
              return 'mock_response_for_testing';
            }
          };
        `
      });
    });

    return true;
  }

  /**
   * Strategy 4: Environment-based bypass
   * Checks if we're in a test environment and handles accordingly
   */
  async environmentBypass() {
    const isTestEnvironment = process.env.NODE_ENV === 'test' ||
                            process.env.TESTING === 'true' ||
                            this.page.url().includes('test') ||
                            this.page.url().includes('staging');

    if (isTestEnvironment) {
      console.log('Test environment detected, applying reCAPTCHA bypass');

      // Add test parameter to disable reCAPTCHA if the site supports it
      await this.page.addInitScript(() => {
        // Set test mode flags
        window.testMode = true;
        window.skipRecaptcha = true;

        // Add test parameter to forms if they check for it
        document.addEventListener('DOMContentLoaded', () => {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
            const testInput = document.createElement('input');
            testInput.type = 'hidden';
            testInput.name = 'test_mode';
            testInput.value = 'true';
            form.appendChild(testInput);
          });
        });
      });

      return true;
    }

    console.log('Not in test environment, cannot apply environment bypass');
    return false;
  }

  /**
   * Strategy 5: Direct API submission bypass
   * Attempts to submit form data directly to the API endpoint
   */
  async directApiSubmission() {
    console.log('Attempting direct API submission (bypasses frontend reCAPTCHA)');

    // This strategy would require knowledge of the backend API
    // For now, we'll just mock it by removing reCAPTCHA elements
    await this.page.evaluate(() => {
      // Remove reCAPTCHA elements from the DOM
      const recaptchaElements = document.querySelectorAll('[class*="recaptcha"], [id*="recaptcha"], .g-recaptcha');
      recaptchaElements.forEach(el => el.remove());

      // Remove any reCAPTCHA validation from form submission
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const originalSubmit = form.submit;
        form.submit = function() {
          console.log('Bypassing reCAPTCHA validation on form submit');
          return originalSubmit.call(this);
        };
      });
    });

    return true;
  }

  /**
   * Check if reCAPTCHA is present on the page
   * @returns {Promise<boolean>} - True if reCAPTCHA is detected
   */
  async isRecaptchaPresent() {
    try {
      const recaptchaSelectors = [
        '.g-recaptcha',
        '[class*="recaptcha"]',
        '[id*="recaptcha"]',
        'iframe[src*="recaptcha"]',
        'script[src*="recaptcha"]'
      ];

      for (const selector of recaptchaSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`reCAPTCHA detected using selector: ${selector}`);
          return true;
        }
      }

      // Check if grecaptcha object exists
      const grecaptchaExists = await this.page.evaluate(() => {
        return typeof window.grecaptcha !== 'undefined';
      });

      if (grecaptchaExists) {
        console.log('reCAPTCHA detected: grecaptcha object found');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for reCAPTCHA:', error);
      return false;
    }
  }

  /**
   * Wait for reCAPTCHA to be handled/bypassed
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} - True if successfully handled
   */
  async waitForRecaptchaBypass(timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Check if reCAPTCHA is still blocking form submission
        const isBlocking = await this.page.evaluate(() => {
          // Check if there are any visible reCAPTCHA challenges
          const challenges = document.querySelectorAll('.g-recaptcha:not([style*="display: none"])');
          return challenges.length > 0;
        });

        if (!isBlocking) {
          console.log('reCAPTCHA bypass successful');
          return true;
        }

        await this.page.waitForTimeout(500);
      } catch (error) {
        console.error('Error waiting for reCAPTCHA bypass:', error);
      }
    }

    console.log('reCAPTCHA bypass timeout reached');
    return false;
  }

  /**
   * Apply multiple strategies in sequence until one succeeds
   * @returns {Promise<boolean>} - True if any strategy succeeded
   */
  async applyMultipleStrategies() {
    const strategies = [
      this.strategies.INTERCEPT_NETWORK,
      this.strategies.MOCK_RESPONSE,
      this.strategies.DISABLE_SCRIPTS,
      this.strategies.DIRECT_API
    ];

    for (const strategy of strategies) {
      console.log(`Trying reCAPTCHA strategy: ${strategy}`);

      try {
        const success = await this.handleRecaptcha(strategy);
        if (success) {
          console.log(`Successfully applied reCAPTCHA strategy: ${strategy}`);
          return true;
        }
      } catch (error) {
        console.error(`Strategy ${strategy} failed:`, error);
        continue;
      }
    }

    console.error('All reCAPTCHA bypass strategies failed');
    return false;
  }
}

module.exports = RecaptchaHandler;