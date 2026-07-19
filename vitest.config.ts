import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, defineProject } from 'vitest/config';

const projectRoot = dirname(fileURLToPath(import.meta.url));

function storybookProject(theme: 'light' | 'dark') {
  return defineProject({
    optimizeDeps: {
      // aria-query publishes CommonJS with named exports. Pre-bundling keeps
      // Storybook's accessibility annotations from loading it as raw ESM in
      // the browser runner.
      include: ['aria-query', 'axe-core', 'lz-string', 'pretty-format'],
    },
    plugins: [
      storybookTest({
        configDir: join(projectRoot, '.storybook'),
        initialGlobals: { theme },
        tags: {
          include: ['test'],
          exclude: [],
          skip: [],
        },
      }),
    ],
    test: {
      name: `storybook-${theme}`,
      browser: {
        enabled: true,
        provider: playwright({}),
        headless: true,
        instances: [{ browser: 'chromium' }],
      },
      retry: process.env.CI ? 1 : 0,
      setupFiles: [join(projectRoot, '.storybook/vitest.setup.ts')],
      testTimeout: 120_000,
    },
  });
}

export default defineConfig({
  test: {
    projects: [storybookProject('light'), storybookProject('dark')],
  },
});
