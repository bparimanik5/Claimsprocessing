// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // The backend is an in-memory store shared across all requests with no per-test reset
  // endpoint, so tests are run serially to avoid cross-test data contamination
  // (e.g. claim-numbering assertions racing with claims created by other specs).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Starts both the backend API and the frontend dev server before the suite runs.
  // Skip this (set SKIP_WEBSERVER=1) if you're already running both yourself.
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm start --prefix ../backend',
          url: 'http://localhost:4000/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
        },
        {
          command: 'npm run dev --prefix ../frontend',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
        },
      ],
});
