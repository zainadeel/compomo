import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5199',
  },
  webServer: {
    command: 'npx vite --config tests/e2e/vite.config.mts',
    url: 'http://localhost:5199',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
