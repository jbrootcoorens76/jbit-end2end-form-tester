/**
 * Form Validation Helper
 *
 * Utility class for validating actual server-side form processing vs frontend submission.
 * This helps distinguish between forms that submit without errors but aren't processed
 * by the server vs forms that are actually processed successfully.
 */

class FormValidationHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Comprehensive validation of form submission success
   * @param {Object} options - Validation options
   * @param {number} options.waitTime - Time to wait for server processing (default: 6000ms)
   * @param {boolean} options.takeScreenshots - Whether to take debug screenshots
   * @param {string} options.screenshotPrefix - Prefix for screenshot filenames
   * @returns {Object} Validation results with success/failure status and details
   */
  async validateFormSubmission(options = {}) {
    const {
      waitTime = 6000,
      takeScreenshots = true,
      screenshotPrefix = 'form-validation'
    } = options;

    console.log(`🔍 Starting comprehensive form submission validation (waiting ${waitTime}ms for server processing)...`);

    // Wait for server processing
    await this.page.waitForTimeout(waitTime);

    if (takeScreenshots) {
      await this.page.screenshot({
        path: `./test-artifacts/${screenshotPrefix}-post-submission.png`,
        fullPage: true
      });
    }

    const results = {
      success: false,
      hasSuccessMessage: false,
      hasErrorMessage: false,
      fieldsCleared: false,
      urlChanged: false,
      networkRequests: 0,
      errorDetails: null,
      successDetails: null
    };

    try {
      // 1. Check for explicit success messages
      console.log('1️⃣ Checking for success messages...');
      const successSelectors = [
        'text="Bedankt voor je bericht"',           // Dutch: Thanks for your message
        'text="Uw bericht is verzonden"',          // Dutch: Your message has been sent
        'text="Thank you for your message"',       // English
        'text="Your message has been sent"',       // English
        'text="Message sent successfully"',        // English
        'text="Merci pour votre message"',         // French
        '.elementor-message.elementor-message-success',
        '.elementor-form-success',
        '.elementor-success-message',
        '.success-message',
        '[data-success="true"]',
        '.form-success'
      ];

      for (const selector of successSelectors) {
        if (await this.page.locator(selector).isVisible()) {
          results.hasSuccessMessage = true;
          results.successDetails = selector;
          console.log(`   ✅ Success message found: ${selector}`);
          break;
        }
      }

      if (!results.hasSuccessMessage) {
        console.log('   ⚠️ No explicit success message found');
      }

      // 2. Check for explicit error messages
      console.log('2️⃣ Checking for error messages...');
      const errorSelectors = [
        'text="Please verify that you are human"',
        'text="Your submission failed because of an error"',
        'text="Er is een fout opgetreden"',          // Dutch: An error occurred
        'text="Verzending mislukt"',                // Dutch: Submission failed
        'text="Une erreur est survenue"',           // French: An error occurred
        '.elementor-message.elementor-message-danger',
        '.elementor-message.elementor-message-error',
        '.elementor-form-error',
        '.elementor-error-message',
        '.error-message',
        '[data-error="true"]',
        '.form-error'
      ];

      for (const selector of errorSelectors) {
        if (await this.page.locator(selector).isVisible()) {
          results.hasErrorMessage = true;
          results.errorDetails = selector;
          console.log(`   ❌ Error message found: ${selector}`);
          break;
        }
      }

      if (!results.hasErrorMessage) {
        console.log('   ✅ No error messages found');
      }

      // 3. Check if form fields were cleared (typical success behavior)
      console.log('3️⃣ Checking if form fields were cleared...');
      const fieldValues = await this.getFormFieldValues();
      results.fieldsCleared = this.areFieldsCleared(fieldValues);

      console.log('   Form field values:');
      Object.entries(fieldValues).forEach(([field, value]) => {
        console.log(`     ${field}: "${value}" (cleared: ${!value})`);
      });
      console.log(`   All fields cleared: ${results.fieldsCleared ? '✅' : '❌'}`);

      // 4. Check for URL changes (redirect to thank you page)
      console.log('4️⃣ Checking for URL changes...');
      const currentUrl = this.page.url();
      results.urlChanged = !currentUrl.includes('/contact-nl/') && !currentUrl.includes('/contact/');
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Redirected from form: ${results.urlChanged ? '✅' : '❌'}`);

      // 5. Determine overall success
      console.log('5️⃣ Determining overall success...');

      // Primary failure condition: explicit error messages
      if (results.hasErrorMessage) {
        results.success = false;
        console.log(`   ❌ FAILURE: Error message detected - ${results.errorDetails}`);
      } else {
        // Success if we have at least one positive indicator
        const successIndicators = [
          results.hasSuccessMessage,
          results.fieldsCleared,
          results.urlChanged
        ];

        const successCount = successIndicators.filter(Boolean).length;
        results.success = successCount > 0;

        console.log(`   Success indicators present: ${successCount}/3`);
        console.log(`   Overall success: ${results.success ? '✅' : '❌'}`);
      }

      // Summary
      console.log('\\n📊 VALIDATION SUMMARY:');
      console.log(`   ✅ Success message: ${results.hasSuccessMessage}`);
      console.log(`   ❌ Error message: ${results.hasErrorMessage}`);
      console.log(`   🧹 Fields cleared: ${results.fieldsCleared}`);
      console.log(`   🔀 URL changed: ${results.urlChanged}`);
      console.log(`   🎯 Overall success: ${results.success}`);
      console.log('='.repeat(50));

      if (takeScreenshots) {
        const screenshotPath = results.success
          ? `./test-artifacts/${screenshotPrefix}-success.png`
          : `./test-artifacts/${screenshotPrefix}-failure.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
      }

      return results;

    } catch (error) {
      console.error('❌ Form validation failed with error:', error.message);
      results.success = false;
      results.errorDetails = `Validation error: ${error.message}`;

      if (takeScreenshots) {
        await this.page.screenshot({
          path: `./test-artifacts/${screenshotPrefix}-error.png`,
          fullPage: true
        });
      }

      return results;
    }
  }

  /**
   * Get current values of all form fields
   * @returns {Object} Object with form field values
   */
  async getFormFieldValues() {
    const values = {};

    try {
      // Name field
      const nameField = this.page.locator('input[name*="naam"], input[name*="name"], input[name*="form_fields[name]"]').first();
      if (await nameField.count() > 0) {
        values.name = await nameField.inputValue();
      }

      // Email field
      const emailField = this.page.locator('input[name*="email"], input[name*="form_fields[email]"]').first();
      if (await emailField.count() > 0) {
        values.email = await emailField.inputValue();
      }

      // Phone field
      const phoneField = this.page.locator('input[name*="telefoon"], input[name*="phone"], input[name*="form_fields[phone]"]').first();
      if (await phoneField.count() > 0) {
        values.phone = await phoneField.inputValue();
      }

      // Message field
      const messageField = this.page.locator('textarea[name*="bericht"], textarea[name*="message"], textarea[name*="form_fields[message]"]').first();
      if (await messageField.count() > 0) {
        values.message = await messageField.inputValue();
      }

    } catch (error) {
      console.error('Error getting form field values:', error.message);
    }

    return values;
  }

  /**
   * Check if form fields are cleared (empty)
   * @param {Object} fieldValues - Object with form field values
   * @returns {boolean} True if all fields are empty
   */
  areFieldsCleared(fieldValues) {
    const requiredFields = ['name', 'email', 'message'];
    return requiredFields.every(field => !fieldValues[field] || fieldValues[field].trim() === '');
  }

  /**
   * Setup network monitoring for form submissions
   * @returns {Object} Object with request/response tracking arrays
   */
  setupNetworkMonitoring() {
    const tracking = {
      requests: [],
      responses: []
    };

    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('wp-admin/admin-ajax.php') ||
          url.includes('elementor') ||
          url.includes('contact') ||
          request.method() === 'POST') {
        tracking.requests.push({
          url: url,
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`📡 Tracking request: ${request.method()} ${url}`);
      }
    });

    this.page.on('response', response => {
      const url = response.url();
      if (url.includes('wp-admin/admin-ajax.php') ||
          url.includes('elementor') ||
          url.includes('contact')) {
        tracking.responses.push({
          url: url,
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log(`📡 Response: ${response.status()} ${url}`);
      }
    });

    return tracking;
  }

  /**
   * Validate that form submission was successful
   * Throws detailed error if validation fails
   * @param {Object} validationResults - Results from validateFormSubmission()
   */
  assertSubmissionSuccess(validationResults) {
    if (validationResults.hasErrorMessage) {
      throw new Error(
        `❌ FORM SUBMISSION FAILED: Server returned error message - ${validationResults.errorDetails}. ` +
        `This indicates the form was NOT processed by the server.`
      );
    }

    if (!validationResults.success) {
      throw new Error(
        `❌ FORM SUBMISSION STATUS UNCLEAR: No positive success indicators found. ` +
        `The form may have been submitted but not processed by the server. ` +
        `Check WordPress admin panel for actual submissions. ` +
        `Details: success_message=${validationResults.hasSuccessMessage}, ` +
        `fields_cleared=${validationResults.fieldsCleared}, ` +
        `url_changed=${validationResults.urlChanged}`
      );
    }

    console.log('✅ Form submission validation passed - server processing confirmed');
  }
}

module.exports = FormValidationHelper;