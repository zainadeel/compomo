import { defineConfig, devices } from '@playwright/test';

const port = 6007;
const baseURL = `http://127.0.0.1:${port}`;
const updatingBaseline = process.env.STORYBOOK_A11Y_UPDATE === '1';

export default defineConfig({
  testDir: './tests/storybook',
  fullyParallel: !updatingBaseline,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // axe-core keeps per-page run state and can report "Axe is already running"
  // under concurrent Storybook scans. Keep scans serial while retaining one
  // independently retryable Playwright test per component story file.
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 3 * 60_000,
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
  ],
  webServer: {
    command: `vite preview --outDir storybook-static --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/index.json`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
