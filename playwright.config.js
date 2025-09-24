// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * Get customer-specific output directory based on test file path
 * This function determines which customer's directory to use for outputs
 */
function getCustomerOutputDir(testFilePath = '') {
  // Extract customer name from test file path
  const match = testFilePath.match(/customers[\/\\]([^\/\\]+)/);
  if (match) {
    return path.join('customers', match[1], 'reports');
  }

  // Fallback for when customer can't be determined
  const customer = process.env.CUSTOMER || 'default';
  return path.join('customers', customer, 'reports');
}

// Get current customer context
const currentCustomer = process.env.CUSTOMER || 'jbit';
const outputDir = path.join('customers', currentCustomer, 'reports');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './customers',
  /* Configure output directories for customer-specific results */
  outputDir: path.join(outputDir, 'test-artifacts'),

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', {
      open: 'never',
      outputFolder: path.join(outputDir, 'html-report')
    }],
    ['list'],
    ['json', {
      outputFile: path.join(outputDir, 'test-results.json')
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Default timeout for actions */
    actionTimeout: 10000,

    /* Default timeout for navigation */
    navigationTimeout: 30000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  /* Global test timeout */
  timeout: 60000,

  /* Global expect timeout */
  expect: {
    timeout: 10000
  }
});