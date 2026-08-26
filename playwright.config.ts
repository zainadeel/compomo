import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const port = 5199;
const baseURL = `http://${host}:${port}`;
const isMacOS = process.platform === 'darwin';
const enableHostFirefox = process.env.PLAYWRIGHT_ENABLE_FIREFOX === '1';

// Playwright's macOS Firefox build is Nightly. On this host it can launch the
// process but never establish the headless Juggler pipe, leaving multiple
// high-CPU Nightly workers alive until the browser launch timeout. Firefox
// remains covered on Linux CI and through the Docker-backed local helper.
const firefoxProject =
  !isMacOS || enableHostFirefox
    ? [
        {
          name: 'firefox',
          grepInvert: /@chromium-only/,
          use: { ...devices['Desktop Firefox'] },
        },
      ]
    : [];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...firefoxProject,
    {
      name: 'webkit',
      grepInvert: /@chromium-only/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: `npx vite --config tests/e2e/vite.config.mts --host ${host} --port ${port} --strictPort`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
