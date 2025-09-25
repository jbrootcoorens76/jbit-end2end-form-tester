const { test, expect } = require('@playwright/test');
const RecaptchaHandler = require('./utils/recaptcha-handler');

// Load test data
const testData = require('../data/test-data.json');

/**
 * JBIT Contact Form Test Suite
 * Simplified approach using the working smoke test pattern
 * Tests the Dutch contact form at https://jbit.be/contact-nl/
 */
test.describe('JBIT Contact Form Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Setup reCAPTCHA bypass before navigation (this is the key!)
    console.log('Setting up reCAPTCHA bypass...');
    const recaptchaHandler = new RecaptchaHandler(page);
    await recaptchaHandler.handleRecaptcha();

    // Navigate to the form
    await page.goto('https://jbit.be/contact-nl/');
    console.log('Navigated to JBIT contact form');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  /**
   * TC-001: Successful Form Submission (Happy Path)
   * Verify form submits successfully with valid data
   */
  test('TC-001: Should submit form successfully with valid data', async ({ page }) => {
    const validData = testData.test_data_sets.valid_data.happy_path_basic;

    try {
      // Fill form fields using the working selector approach
      console.log('Filling form with valid data...');

      // Name field - using flexible selectors
      const nameField = await page.locator('input[name*="naam"], input[name*="name"], input[name*="form_fields[name]"]').first();
      await nameField.fill(validData.name);
      console.log('Name field filled');

      // Email field
      const emailField = await page.locator('input[name*="email"], input[name*="form_fields[email]"]').first();
      await emailField.fill(validData.email);
      console.log('Email field filled');

      // Phone field (optional)
      const phoneField = await page.locator('input[name*="telefoon"], input[name*="phone"], input[name*="form_fields[phone]"]').first();
      await phoneField.fill(validData.phone);
      console.log('Phone field filled');

      // Message field
      const messageField = await page.locator('textarea[name*="bericht"], textarea[name*="message"], textarea[name*="form_fields[message]"]').first();
      await messageField.fill(validData.message);
      console.log('Message field filled');

      // Interest checkboxes - select first available option
      const interestCheckbox = await page.locator('input[type="checkbox"]').first();
      await interestCheckbox.check();
      console.log('Interest option selected');

      console.log('Form filled successfully');

      // Submit form and validate server processing
      const submitButton = await page.locator('button[type="submit"], .elementor-button, button:has-text("Send")').first();
      await submitButton.click();
      console.log('Form submitted');

      // Wait longer for server processing
      await page.waitForTimeout(6000);

      // Comprehensive validation of actual server processing
      console.log('Validating server processing...');

      // Check for success indicators
      const successSelectors = [
        'text="Bedankt voor je bericht"',
        'text="Uw bericht is verzonden"',
        'text="Thank you for your message"',
        '.elementor-message-success',
        '.elementor-form-success'
      ];

      let hasSuccess = false;
      for (const selector of successSelectors) {
        if (await page.locator(selector).isVisible()) {
          hasSuccess = true;
          console.log(`✅ Success indicator found: ${selector}`);
          break;
        }
      }

      // Check for error indicators
      const errorSelectors = [
        'text="Please verify that you are human"',
        'text="Your submission failed because of an error"',
        'text="Er is een fout opgetreden"',
        '.elementor-message-danger',
        '.elementor-message-error'
      ];

      let hasError = false;
      let errorType = '';
      for (const selector of errorSelectors) {
        if (await page.locator(selector).isVisible()) {
          hasError = true;
          errorType = selector;
          console.log(`❌ Error indicator found: ${selector}`);
          break;
        }
      }

      // Check if form fields were cleared (success indicator)
      const nameCleared = !(await page.locator('input[name*="naam"], input[name*="name"]').first().inputValue());
      const emailCleared = !(await page.locator('input[name*="email"]').first().inputValue());
      const messageCleared = !(await page.locator('textarea[name*="bericht"], textarea[name*="message"]').first().inputValue());
      const fieldsCleared = nameCleared && emailCleared && messageCleared;

      console.log(`Fields cleared: ${fieldsCleared}`);

      // URL check
      const currentUrl = page.url();
      const urlChanged = !currentUrl.includes('/contact-nl/');
      console.log(`URL changed: ${urlChanged}`);

      // Determine if submission was actually successful
      const actuallySuccessful = hasSuccess || (fieldsCleared && !hasError) || urlChanged;

      console.log('=== SUBMISSION VALIDATION SUMMARY ===');
      console.log(`Success message: ${hasSuccess}`);
      console.log(`Error message: ${hasError} (${errorType})`);
      console.log(`Fields cleared: ${fieldsCleared}`);
      console.log(`URL changed: ${urlChanged}`);
      console.log(`Actually successful: ${actuallySuccessful}`);
      console.log('=====================================');

      // Fail if clear error indicators
      if (hasError) {
        throw new Error(`❌ Form submission failed - Server processing error detected: ${errorType}`);
      }

      // Require positive success indicators
      if (!actuallySuccessful) {
        throw new Error('❌ Form submission status unclear - No clear success indicators found');
      }

      expect(currentUrl).toContain('jbit.be');
      expect(hasError).toBe(false);
      expect(actuallySuccessful).toBe(true);

      console.log('✅ Test passed - form submission completed without errors');

    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  /**
   * TC-002: Basic Form Loading Test
   * Verify form loads and is accessible
   */
  test('TC-002: Should load form without errors', async ({ page }) => {
    try {
      console.log('Testing form loading...');

      // Check that form elements are present
      const nameField = await page.locator('input[name*="naam"], input[name*="name"]').first();
      const emailField = await page.locator('input[name*="email"]').first();
      const submitButton = await page.locator('button[type="submit"], .elementor-button').first();

      // Verify elements are visible
      await expect(nameField).toBeVisible();
      await expect(emailField).toBeVisible();
      await expect(submitButton).toBeVisible();

      console.log('✅ Form loaded successfully with all essential elements');

    } catch (error) {
      console.error('Form loading test failed:', error);
      throw error;
    }
  });

  /**
   * TC-003: Alternative Data Set Test
   * Test with comprehensive valid data
   */
  test('TC-003: Should submit with comprehensive data', async ({ page }) => {
    const validData = testData.test_data_sets.valid_data.happy_path_comprehensive;

    try {
      console.log('Filling form with comprehensive data...');

      // Fill form fields
      const nameField = await page.locator('input[name*="naam"], input[name*="name"]').first();
      await nameField.fill(validData.name);

      const emailField = await page.locator('input[name*="email"]').first();
      await emailField.fill(validData.email);

      const phoneField = await page.locator('input[name*="telefoon"], input[name*="phone"]').first();
      await phoneField.fill(validData.phone);

      const messageField = await page.locator('textarea[name*="bericht"], textarea[name*="message"]').first();
      await messageField.fill(validData.message);

      // Select interest
      const interestCheckbox = await page.locator('input[type="checkbox"]').first();
      await interestCheckbox.check();

      // Submit form
      const submitButton = await page.locator('button[type="submit"], .elementor-button').first();
      await submitButton.click();

      // Wait for server processing
      await page.waitForTimeout(6000);

      // Validate actual server processing
      console.log('Validating comprehensive data submission...');

      // Check for success/error messages
      const successVisible = await page.locator('.elementor-message-success, text="Bedankt voor je bericht"').isVisible();
      const errorVisible = await page.locator('.elementor-message-danger, text="Please verify that you are human"').isVisible();

      // Check if form was reset/cleared
      const nameValue = await page.locator('input[name*="naam"]').first().inputValue();
      const emailValue = await page.locator('input[name*="email"]').first().inputValue();
      const fieldsReset = !nameValue && !emailValue;

      const currentUrl = page.url();
      const redirected = !currentUrl.includes('/contact-nl/');

      console.log(`Success message: ${successVisible}`);
      console.log(`Error message: ${errorVisible}`);
      console.log(`Fields reset: ${fieldsReset}`);
      console.log(`Redirected: ${redirected}`);

      const submissionSuccessful = successVisible || (fieldsReset && !errorVisible) || redirected;

      if (errorVisible) {
        throw new Error('❌ Comprehensive data test failed - Server processing error detected');
      }

      if (!submissionSuccessful) {
        throw new Error('❌ Comprehensive data test unclear - No success indicators found');
      }

      expect(currentUrl).toContain('jbit.be');
      expect(errorVisible).toBe(false);
      expect(submissionSuccessful).toBe(true);

      console.log('✅ Comprehensive data test passed');

    } catch (error) {
      console.error('Comprehensive data test failed:', error);
      throw error;
    }
  });

});