import { defineConfig, devices } from '@playwright/test';
import { crossBrowserContractSpecs } from './tests/e2e/browser-tier';

const host = '127.0.0.1';
const port = 5199;
const baseURL = `http://${host}:${port}`;
const isMacOS = process.platform === 'darwin';
const enableHostFirefox = process.env.PLAYWRIGHT_ENABLE_FIREFOX === '1';

// These specs own behavior where browser engines can materially differ:
// native forms and focus, anchored overlays, scrolling, touch, responsive
// shell ownership, virtualization, and motion lifecycle. Every rendered spec
// still runs in Chromium; Firefox and WebKit repeat only this contract set.
const crossBrowserTestMatch = crossBrowserContractSpecs.map(spec => `**/${spec}`);

// Playwright's macOS Firefox build is Nightly. On this host it can launch the
// process but never establish the headless Juggler pipe, leaving multiple
// high-CPU Nightly workers alive until the browser launch timeout. Firefox
// remains covered on Linux CI and through the Docker-backed local helper.
const firefoxProject =
  !isMacOS || enableHostFirefox
    ? [
        {
          name: 'firefox',
          testMatch: crossBrowserTestMatch,
          grepInvert: /@chromium-only/,
          use: { ...devices['Desktop Firefox'] },
        },
      ]
    : [];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 4 : undefined,
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
      testMatch: crossBrowserTestMatch,
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
