const { test, expect } = require('@playwright/test');
const RecaptchaHandler = require('./utils/recaptcha-handler');

/**
 * JBIT Contact Form - Server Processing Validation
 *
 * This test suite specifically validates that forms are actually processed by the server,
 * not just submitted without errors. It distinguishes between:
 * 1. Frontend submission (form data sent to server)
 * 2. Backend processing (server actually receives and processes the data)
 *
 * Key Success Indicators:
 * - Success messages displayed
 * - Form fields cleared after submission
 * - URL redirect to thank you page
 * - Absence of error messages
 * - Network requests completed successfully
 *
 * Key Failure Indicators:
 * - Turnstile error messages
 * - Generic submission failure messages
 * - Form fields remain filled
 * - Error styling applied to form
 */
test.describe('JBIT Contact Form - Server Processing Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Setup reCAPTCHA bypass
    console.log('Setting up reCAPTCHA bypass for server processing validation...');
    const recaptchaHandler = new RecaptchaHandler(page);
    await recaptchaHandler.handleRecaptcha();

    // Navigate to the form
    await page.goto('https://jbit.be/contact-nl/');
    console.log('Navigated to JBIT contact form');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  /**
   * TC-SPV-001: Comprehensive Server Processing Validation
   * This test validates that the form is actually processed by the WordPress/Elementor backend
   */
  test('TC-SPV-001: Should validate actual server-side form processing', async ({ page }) => {
    console.log('Starting comprehensive server processing validation...');

    // Test data
    const formData = {
      naam: 'E2E Test Server Validation',
      email: 'server.validation@test.com',
      telefoon: '06-87654321',
      bericht: 'This is a server processing validation test. If you receive this, the form is working correctly and bypassing Turnstile.'
    };

    try {
      // Capture initial state
      await page.screenshot({ path: './test-artifacts/01-initial-form-state.png', fullPage: true });

      // Monitor network requests to track form submission
      const submissionRequests = [];
      const responsePromises = [];

      page.on('request', request => {
        const url = request.url();
        // Track potential form submission requests
        if (url.includes('wp-admin/admin-ajax.php') ||
            url.includes('elementor') ||
            url.includes('contact') ||
            request.method() === 'POST') {
          console.log(`📡 Tracking request: ${request.method()} ${url}`);
          submissionRequests.push({
            url: url,
            method: request.method(),
            postData: request.postData()
          });
        }
      });

      page.on('response', response => {
        const url = response.url();
        if (url.includes('wp-admin/admin-ajax.php') ||
            url.includes('elementor') ||
            url.includes('contact')) {
          console.log(`📡 Response received: ${response.status()} ${url}`);
          responsePromises.push(response);
        }
      });

      // Fill the form with test data
      console.log('Filling form with validation test data...');

      const nameField = page.locator('input[name*="naam"], input[name*="name"]').first();
      await nameField.fill(formData.naam);
      console.log('✅ Name field filled');

      const emailField = page.locator('input[name*="email"]').first();
      await emailField.fill(formData.email);
      console.log('✅ Email field filled');

      const phoneField = page.locator('input[name*="telefoon"], input[name*="phone"]').first();
      await phoneField.fill(formData.telefoon);
      console.log('✅ Phone field filled');

      const messageField = page.locator('textarea[name*="bericht"], textarea[name*="message"]').first();
      await messageField.fill(formData.bericht);
      console.log('✅ Message field filled');

      // Select interest checkbox
      const interestCheckbox = page.locator('input[type="checkbox"]').first();
      if (await interestCheckbox.count() > 0) {
        await interestCheckbox.check();
        console.log('✅ Interest checkbox selected');
      }

      // Capture form filled state
      await page.screenshot({ path: './test-artifacts/02-form-filled.png', fullPage: true });

      // Submit the form
      console.log('Submitting form and monitoring server response...');
      const submitButton = page.locator(
        'button[type="submit"], input[type="submit"], button:has-text("Verstuur"), button:has-text("Send")'
      ).first();

      // Verify submit button is ready
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      // Submit and wait for processing
      await submitButton.click();
      console.log('🚀 Form submitted, waiting for server processing...');

      // Wait longer for server processing
      await page.waitForTimeout(8000);

      // Capture post-submission state
      await page.screenshot({ path: './test-artifacts/03-post-submission.png', fullPage: true });

      // === COMPREHENSIVE SUCCESS/FAILURE VALIDATION ===

      console.log('\\n🔍 ANALYZING SUBMISSION RESULTS...');

      // 1. Check for explicit success messages
      console.log('1️⃣ Checking for success messages...');
      const successSelectors = [
        'text="Bedankt voor je bericht"',
        'text="Uw bericht is verzonden"',
        'text="Thank you for your message"',
        'text="Your message has been sent"',
        'text="Message sent successfully"',
        '.elementor-message.elementor-message-success',
        '.elementor-form-success',
        '.success-message',
        '[data-success="true"]'
      ];

      let successFound = false;
      let successMessage = '';
      for (const selector of successSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          successFound = true;
          successMessage = selector;
          console.log(`   ✅ Success message found: ${selector}`);
          break;
        }
      }

      if (!successFound) {
        console.log('   ⚠️ No explicit success message found');
      }

      // 2. Check for explicit error messages
      console.log('2️⃣ Checking for error messages...');
      const errorSelectors = [
        'text="Please verify that you are human"',
        'text="Your submission failed because of an error"',
        'text="Er is een fout opgetreden"',
        'text="Verzending mislukt"',
        '.elementor-message.elementor-message-danger',
        '.elementor-message.elementor-message-error',
        '.elementor-form-error',
        '.error-message',
        '[data-error="true"]'
      ];

      let errorFound = false;
      let errorMessage = '';
      for (const selector of errorSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          errorFound = true;
          errorMessage = selector;
          console.log(`   ❌ Error message found: ${selector}`);
          break;
        }
      }

      if (!errorFound) {
        console.log('   ✅ No error messages found');
      }

      // 3. Check if form fields were cleared (typical success behavior)
      console.log('3️⃣ Checking if form fields were cleared...');
      const nameValue = await nameField.inputValue();
      const emailValue = await emailField.inputValue();
      const messageValue = await messageField.inputValue();

      const fieldsCleared = !nameValue && !emailValue && !messageValue;
      console.log(`   Name field: "${nameValue}" (cleared: ${!nameValue})`);
      console.log(`   Email field: "${emailValue}" (cleared: ${!emailValue})`);
      console.log(`   Message field: "${messageValue}" (cleared: ${!messageValue})`);
      console.log(`   All fields cleared: ${fieldsCleared ? '✅' : '❌'}`);

      // 4. Check for URL changes (redirect to thank you page)
      console.log('4️⃣ Checking for URL changes...');
      const currentUrl = page.url();
      const redirected = !currentUrl.includes('/contact-nl/');
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Redirected from form: ${redirected ? '✅' : '❌'}`);

      // 5. Analyze network requests
      console.log('5️⃣ Analyzing network requests...');
      console.log(`   Form submission requests tracked: ${submissionRequests.length}`);
      submissionRequests.forEach((req, index) => {
        console.log(`   Request ${index + 1}: ${req.method} ${req.url}`);
      });

      // === DETERMINE OVERALL SUCCESS ===

      console.log('\\n📊 OVERALL SUBMISSION ANALYSIS:');
      console.log(`   ✅ Success message displayed: ${successFound}`);
      console.log(`   ❌ Error message displayed: ${errorFound}`);
      console.log(`   🧹 Form fields cleared: ${fieldsCleared}`);
      console.log(`   🔀 URL redirected: ${redirected}`);
      console.log(`   📡 Network requests made: ${submissionRequests.length > 0}`);

      // Primary failure condition: explicit error messages
      if (errorFound) {
        await page.screenshot({ path: './test-artifacts/04-submission-failed.png', fullPage: true });
        throw new Error(`❌ FORM SUBMISSION FAILED: Error message detected - ${errorMessage}. This indicates the form was NOT processed by the server.`);
      }

      // Success conditions (at least one must be true)
      const successIndicators = [
        successFound,
        fieldsCleared,
        redirected
      ];

      const successCount = successIndicators.filter(Boolean).length;

      if (successCount === 0) {
        await page.screenshot({ path: './test-artifacts/04-submission-unclear.png', fullPage: true });
        throw new Error(`❌ FORM SUBMISSION STATUS UNCLEAR: No positive success indicators found. Form may have been submitted but not processed by server. Check WordPress admin panel for actual submissions.`);
      }

      // Success!
      console.log(`\\n🎉 FORM SUBMISSION SUCCESSFUL! (${successCount}/3 success indicators present)`);
      console.log('✅ The form appears to have been properly processed by the server.');

      await page.screenshot({ path: './test-artifacts/04-submission-successful.png', fullPage: true });

      // Final assertions
      expect(errorFound).toBe(false);
      expect(successCount).toBeGreaterThan(0);
      expect(currentUrl).toContain('jbit.be');

    } catch (error) {
      console.error('Server processing validation failed:', error.message);
      await page.screenshot({ path: './test-artifacts/error-final-state.png', fullPage: true });
      throw error;
    }
  });

  /**
   * TC-SPV-002: Network Response Validation
   * Validates that the server responds correctly to form submissions
   */
  test('TC-SPV-002: Should receive valid server response for form submission', async ({ page }) => {
    console.log('Testing server response validation...');

    const formData = {
      naam: 'Network Response Test',
      email: 'network.test@validation.com',
      telefoon: '06-11223344',
      bericht: 'Testing network response for server processing validation.'
    };

    // Track network responses
    const responses = [];
    page.on('response', response => {
      if (response.request().method() === 'POST') {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`📡 POST response: ${response.status()} ${response.url()}`);
      }
    });

    try {
      // Fill and submit form
      await page.locator('input[name*="naam"]').first().fill(formData.naam);
      await page.locator('input[name*="email"]').first().fill(formData.email);
      await page.locator('input[name*="telefoon"]').first().fill(formData.telefoon);
      await page.locator('textarea[name*="bericht"]').first().fill(formData.bericht);

      const interestCheckbox = page.locator('input[type="checkbox"]').first();
      if (await interestCheckbox.count() > 0) {
        await interestCheckbox.check();
      }

      // Submit and wait for responses
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(5000);

      // Validate we received responses
      console.log(`Total POST responses received: ${responses.length}`);

      if (responses.length === 0) {
        throw new Error('❌ No POST responses received - form may not be submitting to server');
      }

      // Check for successful HTTP responses
      const successfulResponses = responses.filter(r => r.status >= 200 && r.status < 300);
      console.log(`Successful responses (2xx): ${successfulResponses.length}`);

      // Check for server errors
      const errorResponses = responses.filter(r => r.status >= 400);
      console.log(`Error responses (4xx/5xx): ${errorResponses.length}`);

      if (errorResponses.length > 0) {
        errorResponses.forEach(r => {
          console.log(`❌ Server error: ${r.status} ${r.statusText} - ${r.url}`);
        });
        throw new Error(`❌ Server returned error responses: ${errorResponses.length} errors detected`);
      }

      expect(responses.length).toBeGreaterThan(0);
      expect(errorResponses.length).toBe(0);

      console.log('✅ Network response validation passed');

    } catch (error) {
      console.error('Network response validation failed:', error.message);
      throw error;
    }
  });

});