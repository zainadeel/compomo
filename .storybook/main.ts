import type { StorybookConfig } from '@storybook/web-components-vite';
import type { Plugin, ViteDevServer } from 'vite';
import { unwatchFile, watchFile } from 'node:fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const DIST_STAMP = resolve(PROJECT_ROOT, 'dist/.storybook-ready');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');
const PACKAGE_VERSION_JSON = resolve(PROJECT_ROOT, '.storybook/static/package-version.json');

const RELOAD_DEBOUNCE_MS = 350;
const RELOAD_POLL_INTERVAL_MS = 500;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function createDistReloadPlugin(): Plugin {
  return {
    name: 'stencil-dist-reload',
    configureServer(server: ViteDevServer) {
      let reloadTimer: ReturnType<typeof setTimeout> | null = null;

      const scheduleFullReload = (reason: string) => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          server.moduleGraph.invalidateAll();
          server.ws.send({ type: 'full-reload' });
          process.stdout.write(`[storybook] Stencil dist updated (${reason}) — reloading\n`);
          reloadTimer = null;
        }, RELOAD_DEBOUNCE_MS);
      };

      const watchedFiles = new Map([
        [DIST_STAMP, 'component build complete'],
        [PACKAGE_JSON, 'package version'],
        [PACKAGE_VERSION_JSON, 'package version'],
      ]);

      for (const [filePath, reason] of watchedFiles) {
        watchFile(
          filePath,
          { interval: RELOAD_POLL_INTERVAL_MS, persistent: false },
          (current, previous) => {
            if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
              return;
            }
            scheduleFullReload(reason);
          }
        );
      }

      server.httpServer?.once('close', () => {
        for (const filePath of watchedFiles.keys()) unwatchFile(filePath);
      });
    },
  };
}

const config: StorybookConfig = {
  stories: ['../src/docs/**/*.mdx', '../src/wc/**/*.mdx', '../src/wc/**/*.stories.@(ts|tsx)'],
  staticDirs: ['./static', { from: '../docs/licenses', to: '/licenses' }],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  viteFinal: config => {
    config.resolve = config.resolve || {};
    const aliases = Array.isArray(config.resolve.alias) ? config.resolve.alias : [];
    aliases.push({ find: '@', replacement: resolve(__dirname, '../src') });
    config.resolve.alias = aliases;
    config.resolve.dedupe = [
      ...(config.resolve.dedupe || []),
      'lit',
      'lit-html',
      'lit-element',
      '@lit/reactive-element',
    ];

    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = [
      ...(config.server.fs.allow || []),
      PROJECT_ROOT,
      resolve(PROJECT_ROOT, 'dist'),
    ];

    // Stencil publishes one atomic completion stamp. The reload plugin polls that
    // file directly, so Vite does not need to watch the generated dist tree.
    config.server.watch = {
      ...config.server.watch,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      ignored: (filePath: string) => {
        const normalized = normalizePath(filePath);
        if (normalized.includes('/node_modules/')) return true;
        if (normalized.includes('/.git/')) return true;
        if (normalized.includes('/dist/')) return true;
        return false;
      },
    };

    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = [
      ...(config.optimizeDeps.exclude || []),
      '@ds-mo/ui',
      'lit',
      'lit-html',
      'lit-element',
      '@lit/reactive-element',
    ];

    config.plugins = [...(config.plugins || []), createDistReloadPlugin()];

    if (process.env.STORYBOOK_BASE_URL) {
      config.base = process.env.STORYBOOK_BASE_URL;
    }
    return config;
  },
};

export default config;
