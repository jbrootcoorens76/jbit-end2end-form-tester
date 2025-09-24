/**
 * FormHelper - Utility class for common form operations
 * Provides methods for form filling, validation checking, and interaction patterns
 */
class FormHelper {
  constructor(page) {
    this.page = page;
    this.timeout = 10000;
  }

  /**
   * Fill form with data object
   * @param {object} formData - Object containing form field values
   * @param {object} selectors - Object containing field selectors
   */
  async fillForm(formData, selectors) {
    // Fill text inputs
    if (formData.naam && selectors.naam) {
      await this.fillTextField(selectors.naam, formData.naam);
    }

    if (formData.email && selectors.email) {
      await this.fillTextField(selectors.email, formData.email);
    }

    if (formData.telefoon && selectors.telefoon) {
      await this.fillTextField(selectors.telefoon, formData.telefoon);
    }

    if (formData.bericht && selectors.bericht) {
      await this.fillTextArea(selectors.bericht, formData.bericht);
    }

    // Handle checkbox interests
    if (formData.interesse && Array.isArray(formData.interesse) && selectors.interesse) {
      await this.selectCheckboxOptions(selectors.interesse, formData.interesse);
    }
  }

  /**
   * Fill a text field with proper validation
   * @param {string} selector - Field selector
   * @param {string} value - Value to fill
   */
  async fillTextField(selector, value) {
    if (!value) return;

    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.fill(selector, '');
    await this.page.fill(selector, value);

    // Trigger events for validation
    await this.page.dispatchEvent(selector, 'input');
    await this.page.dispatchEvent(selector, 'change');
    await this.page.dispatchEvent(selector, 'blur');

    // Verify value was set
    const actualValue = await this.page.inputValue(selector);
    if (actualValue !== value) {
      throw new Error(`Failed to set value for ${selector}. Expected: '${value}', got: '${actualValue}'`);
    }
  }

  /**
   * Fill a textarea field
   * @param {string} selector - Textarea selector
   * @param {string} value - Value to fill
   */
  async fillTextArea(selector, value) {
    if (!value) return;

    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.fill(selector, '');
    await this.page.fill(selector, value);

    // Trigger events
    await this.page.dispatchEvent(selector, 'input');
    await this.page.dispatchEvent(selector, 'change');
    await this.page.dispatchEvent(selector, 'blur');
  }

  /**
   * Select checkbox options by text
   * @param {string} baseSelector - Base checkbox selector
   * @param {Array} options - Array of option texts to select
   */
  async selectCheckboxOptions(baseSelector, options) {
    if (!options || options.length === 0) return;

    for (const option of options) {
      try {
        // Try different patterns for checkbox selection
        const selectors = [
          `input[value="${option}"]`,
          `input[type="checkbox"][value="${option}"]`,
          `${baseSelector}[value="${option}"]`,
          `label:has-text("${option}") input[type="checkbox"]`,
          `input[type="checkbox"] + label:has-text("${option}")`
        ];

        let found = false;
        for (const selector of selectors) {
          try {
            if (await this.page.isVisible(selector)) {
              await this.page.check(selector);
              found = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!found) {
          console.warn(`Could not find checkbox for option: ${option}`);
        }
      } catch (error) {
        console.warn(`Error selecting checkbox option ${option}:`, error.message);
      }
    }
  }

  /**
   * Submit form and wait for response
   * @param {string} submitSelector - Submit button selector
   * @param {number} timeout - Timeout for submission
   */
  async submitForm(submitSelector, timeout = 30000) {
    // Wait for submit button to be available
    await this.page.waitForSelector(submitSelector, { state: 'visible' });

    // Ensure form is ready for submission
    await this.waitForFormReady();

    // Click submit button
    await this.page.click(submitSelector);

    // Wait for form processing (either success or error response)
    await this.waitForSubmissionResponse(timeout);
  }

  /**
   * Wait for form to be ready for submission
   */
  async waitForFormReady() {
    try {
      // Wait for any client-side validation to complete
      await this.page.waitForFunction(() => {
        // Check if form validation is in progress
        const form = document.querySelector('form');
        if (form) {
          // Check for loading states
          const isLoading = form.classList.contains('loading') ||
                          form.classList.contains('submitting') ||
                          form.querySelector('.loading, .spinner');
          return !isLoading;
        }
        return true;
      }, { timeout: 5000 });
    } catch (error) {
      // Continue if ready check fails
      console.log('Form ready check timed out, continuing...');
    }
  }

  /**
   * Wait for form submission response (success or error)
   * @param {number} timeout - Wait timeout
   */
  async waitForSubmissionResponse(timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check for success message
      const successSelectors = [
        '.elementor-message-success',
        '.success-message',
        '.form-success',
        '.alert-success',
        '[class*="success"]'
      ];

      // Check for error message
      const errorSelectors = [
        '.elementor-message-danger',
        '.error-message',
        '.form-error',
        '.alert-danger',
        '.elementor-field-error',
        '[class*="error"]'
      ];

      // Check for field validation errors
      const fieldErrorSelectors = [
        '.elementor-field-error',
        '.field-error',
        '.error',
        '.invalid-feedback',
        '[aria-invalid="true"]'
      ];

      // Check if any response appeared
      for (const selector of [...successSelectors, ...errorSelectors, ...fieldErrorSelectors]) {
        if (await this.isElementVisible(selector, 500)) {
          return; // Response received
        }
      }

      // Check if form disappeared (might indicate success)
      const formVisible = await this.isElementVisible('form', 500);
      if (!formVisible) {
        return; // Form disappeared, likely successful
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('Form submission response timeout - no success or error message appeared');
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @param {number} timeout - Wait timeout
   */
  async isElementVisible(selector, timeout = 1000) {
    try {
      await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation error messages
   * @param {Array} errorSelectors - Array of error selectors to check
   */
  async getValidationErrors(errorSelectors) {
    const errors = [];

    for (const selector of errorSelectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            errors.push(text.trim());
          }
        }
      } catch (error) {
        // Continue if selector fails
      }
    }

    return errors;
  }

  /**
   * Check if form has validation errors
   * @param {Array} errorSelectors - Array of error selectors to check
   */
  async hasValidationErrors(errorSelectors) {
    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector, 1000)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if form submission was successful
   * @param {Array} successSelectors - Array of success message selectors
   */
  async isSubmissionSuccessful(successSelectors) {
    for (const selector of successSelectors) {
      if (await this.isElementVisible(selector, 1000)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all form fields
   * @param {object} selectors - Object containing field selectors
   */
  async clearForm(selectors) {
    const fieldSelectors = [
      selectors.naam,
      selectors.email,
      selectors.telefoon,
      selectors.bericht
    ].filter(Boolean);

    for (const selector of fieldSelectors) {
      try {
        if (await this.isElementVisible(selector, 1000)) {
          await this.page.fill(selector, '');
        }
      } catch (error) {
        console.warn(`Could not clear field ${selector}:`, error.message);
      }
    }

    // Uncheck all checkboxes
    if (selectors.interesse) {
      try {
        const checkboxes = await this.page.$$(`${selectors.interesse}`);
        for (const checkbox of checkboxes) {
          try {
            if (await checkbox.isChecked()) {
              await checkbox.uncheck();
            }
          } catch (error) {
            // Continue if uncheck fails
          }
        }
      } catch (error) {
        // Continue if checkbox clearing fails
      }
    }
  }

  /**
   * Get form field values
   * @param {object} selectors - Object containing field selectors
   */
  async getFormValues(selectors) {
    const values = {};

    try {
      if (selectors.naam && await this.isElementVisible(selectors.naam, 1000)) {
        values.naam = await this.page.inputValue(selectors.naam);
      }
    } catch (error) {
      values.naam = '';
    }

    try {
      if (selectors.email && await this.isElementVisible(selectors.email, 1000)) {
        values.email = await this.page.inputValue(selectors.email);
      }
    } catch (error) {
      values.email = '';
    }

    try {
      if (selectors.telefoon && await this.isElementVisible(selectors.telefoon, 1000)) {
        values.telefoon = await this.page.inputValue(selectors.telefoon);
      }
    } catch (error) {
      values.telefoon = '';
    }

    try {
      if (selectors.bericht && await this.isElementVisible(selectors.bericht, 1000)) {
        values.bericht = await this.page.inputValue(selectors.bericht);
      }
    } catch (error) {
      values.bericht = '';
    }

    return values;
  }
}

module.exports = FormHelper;