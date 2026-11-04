const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  // Retry once on CI so a flaky browser start does not fail the build, and keep a
  // trace from the first retry so failures are debuggable from the uploaded report.
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
