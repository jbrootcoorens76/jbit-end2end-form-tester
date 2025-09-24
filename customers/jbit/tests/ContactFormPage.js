const BasePage = require('../../../tests/shared/BasePage');
const FormHelper = require('../../../tests/shared/FormHelper');

/**
 * ContactFormPage - Page Object Model for JBIT Contact Form
 * Handles all interactions with the JBIT contact form on https://jbit.be/contact-nl/
 */
class ContactFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.formHelper = new FormHelper(page);

    // Form URL
    this.url = 'https://jbit.be/contact-nl/';

    // Form field selectors based on actual form inspection
    this.selectors = {
      // Form container
      form: '.elementor-form',

      // Input fields with multiple selector fallbacks
      name: "input[name='form_fields[name]'], #form-field-name",
      email: "input[name='form_fields[email]'], #form-field-email",
      phone: "input[name='form_fields[phone]'], #form-field-phone",
      message: "textarea[name='form_fields[message]'], #form-field-message",

      // Checkbox interests - specific field name
      interesse: "input[name='form_fields[field_a3f7052][]']",
      interesseLabel: "label:has(input[name='form_fields[field_a3f7052][]'])",

      // Submit button - Elementor specific
      submitButton: "button.elementor-button[type='submit'], button:has-text('Send')",

      // Success messages
      successMessage: ".elementor-message-success, .success-message, .form-success, .elementor-form .elementor-message",

      // Error messages
      errorMessage: ".elementor-message-danger, .error-message, .form-error, .elementor-form .elementor-message",
      fieldError: ".elementor-field-error, .field-error, .error, .elementor-field-required",

      // Loading states
      loading: ".loading, .spinner, .elementor-form-loading"
    };

    // Available interest options
    this.interestOptions = [
      'Process Integratie en Automatisatie',
      'Advies op maat',
      'Webdesign',
      'Gepersonaliseerde Webhosting'
    ];

    // Expected Dutch error messages
    this.expectedMessages = {
      success: 'Bedankt voor uw bericht',
      generalError: 'Er is een fout opgetreden',
      requiredField: 'Dit veld is verplicht',
      invalidEmail: 'Voer een geldig emailadres in'
    };
  }

  /**
   * Navigate to the contact form page
   */
  async navigate() {
    console.log(`Navigating to JBIT contact form: ${this.url}`);
    await this.goto(this.url);
    await this.waitForFormLoad();
  }

  /**
   * Wait for form to be fully loaded and ready
   */
  async waitForFormLoad() {
    // Wait for form container
    await this.waitForElement(this.selectors.form, 15000);

    // Wait for key form fields
    await this.waitForElement(this.selectors.name, 10000);
    await this.waitForElement(this.selectors.email, 10000);
    await this.waitForElement(this.selectors.message, 10000);
    await this.waitForElement(this.selectors.submitButton, 10000);

    // Wait for any loading states to disappear
    try {
      await this.page.waitForSelector(this.selectors.loading, {
        state: 'hidden',
        timeout: 5000
      });
    } catch (e) {
      // Loading selector might not exist, continue
    }

    console.log('Contact form loaded successfully');
  }

  /**
   * Fill the contact form with provided data
   * @param {Object} formData - Object containing form field values
   */
  async fillContactForm(formData) {
    console.log('Filling contact form with data:', formData);

    // Fill name field (support both 'name' and 'naam')
    if (formData.name !== undefined || formData.naam !== undefined) {
      const nameValue = formData.name || formData.naam;
      await this.formHelper.fillTextField(this.selectors.name, nameValue);
    }

    // Fill email field
    if (formData.email !== undefined) {
      await this.formHelper.fillTextField(this.selectors.email, formData.email);
    }

    // Fill phone field (support both 'phone' and 'telefoon')
    if (formData.phone !== undefined || formData.telefoon !== undefined) {
      const phoneValue = formData.phone || formData.telefoon;
      await this.formHelper.fillTextField(this.selectors.phone, phoneValue);
    }

    // Fill message field (support both 'message' and 'bericht')
    if (formData.message !== undefined || formData.bericht !== undefined) {
      const messageValue = formData.message || formData.bericht;
      await this.formHelper.fillTextArea(this.selectors.message, messageValue);
    }

    // Handle interesse checkboxes
    if (formData.interesse && Array.isArray(formData.interesse)) {
      await this.selectInterestOptions(formData.interesse);
    }

    console.log('Form filled successfully');
  }

  /**
   * Select interest checkbox options
   * @param {Array} interests - Array of interest option texts
   */
  async selectInterestOptions(interests) {
    console.log('Selecting interest options:', interests);

    for (const interest of interests) {
      if (!this.interestOptions.includes(interest)) {
        console.warn(`Unknown interest option: ${interest}`);
        continue;
      }

      // Try multiple selector strategies for checkboxes
      const selectors = [
        `input[name='form_fields[field_a3f7052][]'][value='${interest}']`,
        `input[type='checkbox'][value='${interest}']`,
        `label:has-text('${interest}') input[type='checkbox']`,
        `input[type='checkbox'] + label:has-text('${interest}')`,
        `#form-field-field_a3f7052-0[value='${interest}']`,
        `#form-field-field_a3f7052-1[value='${interest}']`,
        `#form-field-field_a3f7052-2[value='${interest}']`,
        `#form-field-field_a3f7052-3[value='${interest}']`
      ];

      let found = false;
      for (const selector of selectors) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
            await element.check();
            console.log(`Selected interest: ${interest}`);
            found = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!found) {
        // Fallback: click on label containing the text
        try {
          await this.page.click(`text=${interest}`);
          console.log(`Selected interest via text click: ${interest}`);
        } catch (error) {
          console.warn(`Could not select interest option: ${interest}`);
        }
      }
    }
  }

  /**
   * Submit the contact form
   */
  async submitForm() {
    console.log('Submitting contact form');

    // Scroll to submit button to ensure it's visible
    await this.scrollToElement(this.selectors.submitButton);

    // Wait for submit button and click
    await this.formHelper.submitForm(this.selectors.submitButton);

    console.log('Form submitted, waiting for response');
  }

  /**
   * Check if form submission was successful
   * @returns {boolean} - True if success message is displayed
   */
  async isSubmissionSuccessful() {
    const isSuccessful = await this.isElementVisible(this.selectors.successMessage, 10000);

    if (isSuccessful) {
      const successText = await this.getElementText(this.selectors.successMessage);
      console.log('Success message displayed:', successText);

      // Verify it contains expected success text
      return successText.includes(this.expectedMessages.success);
    }

    return false;
  }

  /**
   * Check if form has validation errors
   * @returns {boolean} - True if validation errors are present
   */
  async hasValidationErrors() {
    const errorSelectors = [
      this.selectors.fieldError,
      this.selectors.errorMessage
    ];

    return await this.formHelper.hasValidationErrors(errorSelectors);
  }

  /**
   * Get all validation error messages
   * @returns {Array} - Array of error message texts
   */
  async getValidationErrors() {
    const errorSelectors = [
      this.selectors.fieldError,
      this.selectors.errorMessage
    ];

    const errors = await this.formHelper.getValidationErrors(errorSelectors);
    console.log('Validation errors found:', errors);
    return errors;
  }

  /**
   * Check for specific field validation error
   * @param {string} fieldName - Name of the field to check
   * @returns {boolean} - True if field has validation error
   */
  async hasFieldValidationError(fieldName) {
    const fieldSelector = this.selectors[fieldName];
    if (!fieldSelector) return false;

    // Check for error indicators near the field
    const errorSelectors = [
      `${fieldSelector}.elementor-field-error`,
      `${fieldSelector}.error`,
      `${fieldSelector}[aria-invalid="true"]`,
      `.elementor-field-group:has(${fieldSelector}) .elementor-field-error`,
      `.form-group:has(${fieldSelector}) .error`
    ];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector, 1000)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear all form fields
   */
  async clearForm() {
    console.log('Clearing contact form');
    await this.formHelper.clearForm(this.selectors);
  }

  /**
   * Get current form values
   * @returns {Object} - Object with current field values
   */
  async getFormValues() {
    return await this.formHelper.getFormValues(this.selectors);
  }

  /**
   * Verify form is ready for interaction
   * @returns {boolean} - True if form is ready
   */
  async isFormReady() {
    try {
      // Check if all required elements are present and visible
      const requiredElements = [
        this.selectors.name,
        this.selectors.email,
        this.selectors.message,
        this.selectors.submitButton
      ];

      for (const selector of requiredElements) {
        if (!await this.isElementVisible(selector, 2000)) {
          console.log(`Required element not ready: ${selector}`);
          return false;
        }
      }

      // Check if form is not in loading state
      if (await this.isElementVisible(this.selectors.loading, 1000)) {
        console.log('Form is still loading');
        return false;
      }

      return true;
    } catch (error) {
      console.log('Form readiness check failed:', error.message);
      return false;
    }
  }

  /**
   * Wait for form validation to complete
   */
  async waitForValidation() {
    // Wait a moment for validation to trigger
    await this.page.waitForTimeout(1000);

    // Wait for validation messages to appear/disappear
    try {
      await this.page.waitForFunction(() => {
        // Check if validation is in progress
        const form = document.querySelector('form');
        if (form && form.classList.contains('validating')) {
          return false;
        }

        // Check for loading states
        const loadingElements = document.querySelectorAll('.loading, .spinner');
        return Array.from(loadingElements).every(el =>
          getComputedStyle(el).display === 'none'
        );
      }, { timeout: 5000 });
    } catch (error) {
      // Continue if validation wait times out
      console.log('Validation wait timed out, continuing...');
    }
  }

  /**
   * Take screenshot for debugging
   * @param {string} testName - Name for the screenshot
   */
  async takeDebugScreenshot(testName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `jbit-contact-form-${testName}-${timestamp}.png`;

    await this.page.screenshot({
      path: `test-results/${filename}`,
      fullPage: true
    });

    console.log(`Debug screenshot saved: ${filename}`);
  }
}

module.exports = ContactFormPage;