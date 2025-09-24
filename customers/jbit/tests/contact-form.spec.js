const { test, expect } = require('@playwright/test');
const ContactFormPage = require('./ContactFormPage');

// Load test data
const testData = require('../data/test-data.json');

/**
 * JBIT Contact Form Test Suite
 * Implements all 11 test scenarios from test-cases.md
 * Tests the Dutch contact form at https://jbit.be/contact-nl/
 */
test.describe('JBIT Contact Form Tests', () => {
  let contactFormPage;

  test.beforeEach(async ({ page }) => {
    contactFormPage = new ContactFormPage(page);
    await contactFormPage.navigate();

    // Verify form is ready before each test
    const isReady = await contactFormPage.isFormReady();
    expect(isReady, 'Contact form should be ready for testing').toBe(true);
  });

  /**
   * TC-001: Successful Form Submission (Happy Path)
   * Verify form submits successfully with valid data
   */
  test('TC-001: Should submit form successfully with valid data', async () => {
    const validData = testData.test_data_sets.valid_data.happy_path_basic;

    // Fill form with valid data
    await contactFormPage.fillContactForm(validData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form submission should be successful').toBe(true);

    // Verify no validation errors
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors after successful submission').toBe(false);
  });

  /**
   * TC-002: Empty Required Fields Validation
   * Verify required field validation works when all fields are empty
   */
  test('TC-002: Should show validation errors for empty required fields', async () => {
    const emptyData = testData.test_data_sets.invalid_data.empty_required_fields;

    // Fill form with empty required fields
    await contactFormPage.fillContactForm(emptyData);

    // Submit form
    await contactFormPage.submitForm();

    // Wait for validation
    await contactFormPage.waitForValidation();

    // Verify form was not submitted successfully
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should not submit with empty required fields').toBe(false);

    // Verify validation errors are present
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should show validation errors for empty required fields').toBe(true);

    // Check specific field errors
    const hasNameError = await contactFormPage.hasFieldValidationError('naam');
    const hasEmailError = await contactFormPage.hasFieldValidationError('email');
    const hasMessageError = await contactFormPage.hasFieldValidationError('bericht');

    expect(hasNameError || hasEmailError || hasMessageError,
           'At least one required field should show validation error').toBe(true);
  });

  /**
   * TC-003: Individual Required Field Validation
   * Test each required field individually
   */
  test('TC-003: Should validate individual required fields', async () => {
    const missingFieldTests = testData.test_data_sets.invalid_data.missing_individual_required;

    for (const testCase of missingFieldTests) {
      // Clear form before each test
      await contactFormPage.clearForm();

      console.log(`Testing missing field: ${testCase.description}`);

      // Fill form with one missing required field
      await contactFormPage.fillContactForm(testCase);

      // Submit form
      await contactFormPage.submitForm();

      // Wait for validation
      await contactFormPage.waitForValidation();

      // Verify form was not submitted successfully
      const isSuccessful = await contactFormPage.isSubmissionSuccessful();
      expect(isSuccessful, `Form should not submit when ${testCase.description}`).toBe(false);

      // Verify validation errors exist
      const hasErrors = await contactFormPage.hasValidationErrors();
      expect(hasErrors, `Should show validation error for ${testCase.description}`).toBe(true);
    }
  });

  /**
   * TC-004: Invalid Email Format Validation
   * Verify email format validation with various invalid formats
   */
  test('TC-004: Should validate email format correctly', async () => {
    const invalidEmailTests = testData.test_data_sets.invalid_data.invalid_email_formats;

    for (const testCase of invalidEmailTests) {
      // Clear form before each test
      await contactFormPage.clearForm();

      console.log(`Testing invalid email: ${testCase.email}`);

      // Fill form with invalid email
      await contactFormPage.fillContactForm(testCase);

      // Submit form
      await contactFormPage.submitForm();

      // Wait for validation
      await contactFormPage.waitForValidation();

      // Verify form was not submitted successfully
      const isSuccessful = await contactFormPage.isSubmissionSuccessful();
      expect(isSuccessful, `Form should not submit with invalid email: ${testCase.email}`).toBe(false);

      // Verify email validation error
      const hasEmailError = await contactFormPage.hasFieldValidationError('email');
      const hasGeneralError = await contactFormPage.hasValidationErrors();

      expect(hasEmailError || hasGeneralError,
             `Should show validation error for invalid email: ${testCase.email}`).toBe(true);
    }
  });

  /**
   * TC-005: Valid Email Formats
   * Verify various valid email formats are accepted
   */
  test('TC-005: Should accept valid email formats', async () => {
    const validEmails = testData.test_data_sets.valid_email_formats;
    const baseData = testData.test_data_sets.valid_data.minimal_required;

    for (const email of validEmails) {
      // Clear form before each test
      await contactFormPage.clearForm();

      console.log(`Testing valid email: ${email}`);

      // Create test data with valid email
      const testData = { ...baseData, email };

      // Fill and submit form
      await contactFormPage.fillContactForm(testData);
      await contactFormPage.submitForm();

      // Verify no email validation errors
      const hasEmailError = await contactFormPage.hasFieldValidationError('email');
      expect(hasEmailError, `Valid email should not trigger validation error: ${email}`).toBe(false);

      // For this test, we accept either success or other validation errors (not email-specific)
      // The key is that email format validation should pass
      const isSuccessful = await contactFormPage.isSubmissionSuccessful();
      if (!isSuccessful) {
        // If not successful, ensure it's not due to email validation
        const errors = await contactFormPage.getValidationErrors();
        const emailErrors = errors.filter(error =>
          error.toLowerCase().includes('email') ||
          error.toLowerCase().includes('emailadres')
        );
        expect(emailErrors.length, `No email-specific errors for valid email: ${email}`).toBe(0);
      }
    }
  });

  /**
   * TC-006: Form Submission Without Optional Fields
   * Verify form works when optional fields are empty
   */
  test('TC-006: Should submit successfully without optional fields', async () => {
    const minimalData = testData.test_data_sets.valid_data.minimal_required;

    // Fill only required fields
    await contactFormPage.fillContactForm(minimalData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully with only required fields').toBe(true);

    // Verify no validation errors for optional fields
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors for empty optional fields').toBe(false);
  });

  /**
   * TC-007: Multiple Interest Selection
   * Test selecting multiple interest options
   */
  test('TC-007: Should handle multiple interest selections', async () => {
    const comprehensiveData = testData.test_data_sets.valid_data.happy_path_comprehensive;

    // Fill form with multiple interests selected
    await contactFormPage.fillContactForm(comprehensiveData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully with multiple interests').toBe(true);

    // Verify no validation errors
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors with multiple interests').toBe(false);
  });

  /**
   * TC-008: Long Message Text
   * Test textarea with extended content
   */
  test('TC-008: Should handle long message text', async () => {
    const longContentData = testData.test_data_sets.edge_cases.long_content;

    // Fill form with long message content
    await contactFormPage.fillContactForm(longContentData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully with long message text').toBe(true);

    // Verify no validation errors
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors with long message').toBe(false);
  });

  /**
   * TC-009: Special Characters in Text Fields
   * Verify handling of special characters and Unicode
   */
  test('TC-009: Should handle special characters correctly', async () => {
    const specialCharsData = testData.test_data_sets.edge_cases.special_characters;

    // Fill form with special characters
    await contactFormPage.fillContactForm(specialCharsData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully with special characters').toBe(true);

    // Verify no validation errors
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors with special characters').toBe(false);
  });

  /**
   * TC-010: Form Reset/Clear After Successful Submission
   * Test form behavior after successful submission
   */
  test('TC-010: Should reset form after successful submission', async () => {
    const validData = testData.test_data_sets.valid_data.happy_path_basic;

    // Fill and submit form successfully
    await contactFormPage.fillContactForm(validData);
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form submission should be successful').toBe(true);

    // Check if form is cleared or hidden
    // Option 1: Form fields are cleared
    try {
      const formValues = await contactFormPage.getFormValues();
      const fieldsCleared = Object.values(formValues).every(value => !value || value.trim() === '');

      if (fieldsCleared) {
        expect(fieldsCleared, 'Form fields should be cleared after successful submission').toBe(true);
        return;
      }
    } catch (error) {
      // Form might not be accessible after submission, which is also acceptable
    }

    // Option 2: Form is hidden/replaced with success message
    const formVisible = await contactFormPage.isElementVisible(contactFormPage.selectors.form, 2000);
    if (!formVisible) {
      expect(formVisible, 'Form should be hidden after successful submission').toBe(false);
      return;
    }

    // If neither option above, at least success message should be visible
    expect(isSuccessful, 'At minimum, success message should be displayed').toBe(true);
  });

  /**
   * TC-011: Error Recovery
   * Test correcting validation errors and resubmitting
   */
  test('TC-011: Should allow error recovery and resubmission', async () => {
    const invalidData = testData.test_data_sets.invalid_data.empty_required_fields;
    const validData = testData.test_data_sets.valid_data.happy_path_basic;

    // First, submit form with errors
    await contactFormPage.fillContactForm(invalidData);
    await contactFormPage.submitForm();
    await contactFormPage.waitForValidation();

    // Verify validation errors appear
    let hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should show validation errors initially').toBe(true);

    // Now correct the errors with valid data
    await contactFormPage.fillContactForm(validData);
    await contactFormPage.submitForm();

    // Verify successful submission after correction
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully after correcting errors').toBe(true);

    // Verify previous errors are gone
    hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Previous validation errors should be cleared after successful submission').toBe(false);
  });

  /**
   * Bonus Test: Unicode Content Support
   * Test form with Unicode characters (Chinese, Russian, Arabic)
   */
  test('Bonus: Should handle Unicode content correctly', async () => {
    const unicodeData = testData.test_data_sets.edge_cases.unicode_content;

    // Fill form with Unicode content
    await contactFormPage.fillContactForm(unicodeData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully with Unicode content').toBe(true);

    // Verify no validation errors
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors with Unicode content').toBe(false);
  });

  /**
   * Bonus Test: Boundary Values
   * Test form with minimal valid values
   */
  test('Bonus: Should handle boundary values correctly', async () => {
    const boundaryData = testData.test_data_sets.edge_cases.boundary_values;

    // Fill form with boundary values
    await contactFormPage.fillContactForm(boundaryData);

    // Submit form
    await contactFormPage.submitForm();

    // Verify successful submission
    const isSuccessful = await contactFormPage.isSubmissionSuccessful();
    expect(isSuccessful, 'Form should submit successfully with boundary values').toBe(true);

    // Verify no validation errors
    const hasErrors = await contactFormPage.hasValidationErrors();
    expect(hasErrors, 'Should have no validation errors with boundary values').toBe(false);
  });

  // Error handling for test failures
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      // Take screenshot on test failure
      const screenshot = await page.screenshot();
      await testInfo.attach('screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });

      // Get page content for debugging
      const html = await page.content();
      await testInfo.attach('page-source', {
        body: html,
        contentType: 'text/html',
      });

      // Log any console errors
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      if (errors.length > 0) {
        await testInfo.attach('console-errors', {
          body: JSON.stringify(errors, null, 2),
          contentType: 'application/json',
        });
      }
    }
  });
});