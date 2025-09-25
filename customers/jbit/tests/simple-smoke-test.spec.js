const { test, expect } = require('@playwright/test');
const RecaptchaHandler = require('./utils/recaptcha-handler');

/**
 * Simple Smoke Test for JBIT Contact Form
 *
 * This is a minimal test that verifies basic form functionality without complex assertions.
 * The goal is to have one passing test that demonstrates the system works.
 *
 * Key Features:
 * - Uses existing reCAPTCHA bypass that's already working
 * - Focuses on form interaction rather than specific success messages
 * - Uses flexible selectors that work with Elementor forms
 * - Provides clear console logging for debugging
 * - Verifies page doesn't crash rather than checking specific responses
 */
test.describe('JBIT Contact Form - Simple Smoke Test', () => {

  test('Should fill and submit form without errors', async ({ page }) => {
    console.log('Starting simple smoke test for JBIT contact form');

    // Setup reCAPTCHA bypass before navigation
    const recaptchaHandler = new RecaptchaHandler(page);
    await recaptchaHandler.handleRecaptcha();

    // Navigate to the form
    await page.goto('https://jbit.be/contact-nl/');
    console.log('Navigated to JBIT contact form');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Simple form data - easily customizable
    const formData = {
      naam: 'Test User',                            // Name field
      email: 'test@example.com',                    // Email field
      telefoon: '06-12345678',                      // Phone field (optional)
      bericht: 'Dit is een test bericht via de automated smoke test.'  // Message field
    };

    try {
      // Fill the form fields - using multiple selector strategies
      console.log('Filling form fields...');

      // Name field
      const nameField = await page.locator('input[name*="naam"], input[name*="name"]').first();
      await nameField.fill(formData.naam);
      console.log('Name field filled');

      // Email field
      const emailField = await page.locator('input[name*="email"]').first();
      await emailField.fill(formData.email);
      console.log('Email field filled');

      // Phone field (optional)
      const phoneField = await page.locator('input[name*="telefoon"], input[name*="phone"]').first();
      if (await phoneField.count() > 0) {
        await phoneField.fill(formData.telefoon);
        console.log('Phone field filled');
      }

      // Message field
      const messageField = await page.locator('textarea[name*="bericht"], textarea[name*="message"]').first();
      await messageField.fill(formData.bericht);
      console.log('Message field filled');

      // Try to select an interest if available
      const interestCheckbox = await page.locator('input[type="checkbox"]').first();
      if (await interestCheckbox.count() > 0) {
        await interestCheckbox.check();
        console.log('Interest checkbox selected');
      }

      // Wait a moment for any dynamic updates
      await page.waitForTimeout(1000);

      // Find and click submit button
      console.log('Looking for submit button...');
      const submitButton = await page.locator(
        'button[type="submit"], input[type="submit"], button:has-text("Verstuur"), button:has-text("Verzend")'
      ).first();

      // Verify submit button is visible and enabled
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      console.log('Submit button found and ready, submitting form...');

      // Take screenshot before submission
      await page.screenshot({ path: './form-filled.png', fullPage: true });
      console.log('Screenshot taken: form filled');

      await submitButton.click();

      // Wait for some response (either success or error)
      await page.waitForTimeout(3000);

      // Take screenshot after submission
      await page.screenshot({ path: './form-submitted.png', fullPage: true });
      console.log('Screenshot taken: form submitted');

      // Wait for form submission to complete - give it time to process
      console.log('Waiting for form submission response...');
      await page.waitForTimeout(5000); // Wait longer for server response

      // Take another screenshot to see the final state
      await page.screenshot({ path: './form-final-state.png', fullPage: true });
      console.log('Screenshot taken: final state');

      // Check for actual success indicators first
      console.log('Checking for success indicators...');

      // Look for success messages in multiple languages
      const successMessages = [
        'text="Bedankt voor je bericht"', // Dutch: Thanks for your message
        'text="Uw bericht is verzonden"', // Dutch: Your message has been sent
        'text="Thank you for your message"', // English
        'text="Your message has been sent"', // English
        'text="Message sent successfully"', // English
        '.elementor-message-success', // Elementor success message class
        '.elementor-form-success', // Elementor form success class
        '[data-success="true"]', // Data attribute for success
        'text="Merci pour votre message"' // French
      ];

      let hasSuccessMessage = false;
      for (const selector of successMessages) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`✅ Success message found: ${selector}`);
          hasSuccessMessage = true;
          break;
        }
      }

      // Check for error messages that indicate submission failure
      console.log('Checking for error messages...');
      const errorMessages = [
        'text="Please verify that you are human"',
        'text="Your submission failed because of an error"',
        'text="Er is een fout opgetreden"', // Dutch: An error occurred
        'text="Verzending mislukt"', // Dutch: Submission failed
        '.elementor-message-danger', // Elementor error message class
        '.elementor-message-error', // Elementor error message class
        '.elementor-form-error', // Elementor form error class
        '[data-error="true"]' // Data attribute for error
      ];

      let hasErrorMessage = false;
      let errorFound = '';
      for (const selector of errorMessages) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          hasErrorMessage = true;
          errorFound = selector;
          console.log(`❌ Error message found: ${selector}`);
          break;
        }
      }

      // Check if form fields are cleared (indicates successful submission)
      // But only if we're still on the contact form page
      let fieldsCleared = false;
      const currentUrl = page.url();
      const stillOnContactForm = currentUrl.includes('/contact-nl/');

      if (stillOnContactForm) {
        try {
          const nameFieldValue = await page.locator('input[name*="naam"], input[name*="name"]').first().inputValue({ timeout: 2000 });
          const emailFieldValue = await page.locator('input[name*="email"]').first().inputValue({ timeout: 2000 });
          const messageFieldValue = await page.locator('textarea[name*="bericht"], textarea[name*="message"]').first().inputValue({ timeout: 2000 });

          fieldsCleared = !nameFieldValue && !emailFieldValue && !messageFieldValue;
          console.log(`Form fields cleared: ${fieldsCleared}`);
          console.log(`Name field value: "${nameFieldValue}"`);
          console.log(`Email field value: "${emailFieldValue}"`);
          console.log(`Message field value: "${messageFieldValue}"`);
        } catch (error) {
          console.log('Could not check form fields (likely redirected to success page)');
          fieldsCleared = false; // We'll rely on URL change detection
        }
      } else {
        console.log('Not on contact form page anymore - likely successful redirect');
        fieldsCleared = false; // We'll rely on URL change detection
      }

      // Check for URL change (redirect to thank you page)
      const urlChanged = !currentUrl.includes('/contact-nl/');
      console.log(`Current URL: ${currentUrl}`);
      console.log(`URL changed from contact form: ${urlChanged}`);

      // Determine if submission was actually successful
      const submissionSuccessful = hasSuccessMessage || (fieldsCleared && !hasErrorMessage) || urlChanged;

      console.log('\n=== SUBMISSION ANALYSIS ===');
      console.log(`Success message found: ${hasSuccessMessage}`);
      console.log(`Error message found: ${hasErrorMessage} (${errorFound})`);
      console.log(`Form fields cleared: ${fieldsCleared}`);
      console.log(`URL changed: ${urlChanged}`);
      console.log(`Overall success: ${submissionSuccessful}`);
      console.log('========================\n');

      // Fail the test if we have clear error indicators
      if (hasErrorMessage) {
        throw new Error(`❌ Form submission failed - Error message detected: ${errorFound}`);
      }

      // Require at least one positive success indicator
      if (!submissionSuccessful) {
        throw new Error('❌ Form submission unclear - No clear success indicators found (no success message, fields not cleared, no redirect)');
      }

      console.log('✅ Form submission appears successful based on indicators');

      // Additional validation
      expect(currentUrl).toBeTruthy();
      expect(currentUrl).toMatch(/jbit\.be/);

      console.log('✅ Smoke test passed - form submission completed without errors');

    } catch (error) {
      console.error('Form interaction failed:', error);

      // Take a screenshot for debugging
      await page.screenshot({ path: 'smoke-test-failure.png' });

      // Still try to verify we didn't break the page completely
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
      expect(currentUrl).toMatch(/jbit\.be/);

      // Rethrow to fail the test
      throw error;
    }
  });

  // Additional minimal test - just verify form loads
  test('Should load contact form without errors', async ({ page }) => {
    console.log('Testing basic form loading...');

    // Navigate to the form
    await page.goto('https://jbit.be/contact-nl/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Basic checks that form elements exist
    const nameField = await page.locator('input[name*="naam"], input[name*="name"]');
    const emailField = await page.locator('input[name*="email"]');
    const messageField = await page.locator('textarea[name*="bericht"], textarea[name*="message"]');
    const submitButton = await page.locator('button[type="submit"], input[type="submit"]');

    // Verify essential form elements are present
    expect(await nameField.count()).toBeGreaterThan(0);
    expect(await emailField.count()).toBeGreaterThan(0);
    expect(await messageField.count()).toBeGreaterThan(0);
    expect(await submitButton.count()).toBeGreaterThan(0);

    console.log('✅ Form loaded successfully with all essential elements');
  });

});