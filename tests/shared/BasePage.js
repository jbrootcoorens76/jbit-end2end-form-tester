/**
 * BasePage - Common functionality for all page objects
 * Provides shared methods for page interactions, waits, and utilities
 */
class BasePage {
  constructor(page) {
    this.page = page;
    this.timeout = 10000;
  }

  /**
   * Navigate to a URL with proper loading checks
   * @param {string} url - The URL to navigate to
   * @param {object} options - Navigation options
   */
  async goto(url, options = {}) {
    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
      ...options
    });

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForPageReady();
  }

  /**
   * Wait for page to be ready (common loading indicators)
   */
  async waitForPageReady() {
    try {
      // Wait for common loading indicators to disappear
      await this.page.waitForFunction(() => {
        // Check if jQuery is loaded and not active
        if (typeof window.$ !== 'undefined') {
          return window.$.active === 0;
        }
        // Check for common loading spinners
        const loaders = document.querySelectorAll('.loading, .spinner, .preloader');
        return loaders.length === 0 || Array.from(loaders).every(loader =>
          getComputedStyle(loader).display === 'none'
        );
      }, { timeout: 10000 });
    } catch (error) {
      // Continue if page ready check fails - not critical
      console.log('Page ready check timed out, continuing...');
    }
  }

  /**
   * Wait for element to be visible and ready for interaction
   * @param {string} selector - Element selector
   * @param {number} timeout - Custom timeout
   */
  async waitForElement(selector, timeout = this.timeout) {
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout
    });

    // Ensure element is not disabled and ready for interaction
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        return element && !element.disabled &&
               getComputedStyle(element).pointerEvents !== 'none';
      },
      selector,
      { timeout: 5000 }
    ).catch(() => {
      // Continue if element ready check fails
    });
  }

  /**
   * Fill input field with proper validation
   * @param {string} selector - Input selector
   * @param {string} value - Value to fill
   * @param {object} options - Fill options
   */
  async fillInput(selector, value, options = {}) {
    await this.waitForElement(selector);

    // Clear field first
    await this.page.fill(selector, '');

    // Fill with value
    if (value) {
      await this.page.fill(selector, value);

      // Verify the value was set correctly
      const actualValue = await this.page.inputValue(selector);
      if (actualValue !== value) {
        throw new Error(`Failed to fill ${selector}. Expected: ${value}, Actual: ${actualValue}`);
      }

      // Trigger input events to ensure validation
      await this.page.dispatchEvent(selector, 'input');
      await this.page.dispatchEvent(selector, 'blur');
    }
  }

  /**
   * Click element with retry logic
   * @param {string} selector - Element selector
   * @param {object} options - Click options
   */
  async clickElement(selector, options = {}) {
    await this.waitForElement(selector);

    // Ensure element is clickable
    await this.page.click(selector, {
      timeout: this.timeout,
      ...options
    });
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @param {number} timeout - Wait timeout
   */
  async isElementVisible(selector, timeout = 5000) {
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
   * Check if element contains specific text
   * @param {string} selector - Element selector
   * @param {string} text - Expected text
   * @param {boolean} exact - Exact match or partial
   */
  async hasText(selector, text, exact = false) {
    try {
      const element = await this.page.waitForSelector(selector, { timeout: 5000 });
      const elementText = await element.textContent();

      if (exact) {
        return elementText.trim() === text.trim();
      } else {
        return elementText.includes(text);
      }
    } catch {
      return false;
    }
  }

  /**
   * Get element text content
   * @param {string} selector - Element selector
   */
  async getElementText(selector) {
    await this.waitForElement(selector);
    return await this.page.textContent(selector);
  }

  /**
   * Take screenshot for debugging
   * @param {string} name - Screenshot name
   */
  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  /**
   * Wait for network requests to complete
   * @param {number} timeout - Wait timeout
   */
  async waitForNetwork(timeout = 10000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Scroll element into view
   * @param {string} selector - Element selector
   */
  async scrollToElement(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle() {
    return await this.page.title();
  }

  /**
   * Wait for page navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForNavigation({ waitUntil: 'networkidle' });
  }

  /**
   * Check if page contains error indicators
   */
  async hasPageErrors() {
    const errorSelectors = [
      '.error',
      '.alert-danger',
      '.elementor-message-danger',
      '[class*="error"]'
    ];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector, 1000)) {
        return true;
      }
    }
    return false;
  }
}

module.exports = BasePage;