import { defineConfig, devices } from '@playwright/test';

const port = 6007;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/storybook',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 10 * 60_000,
  use: {
    baseURL,
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
