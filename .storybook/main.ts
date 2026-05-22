import type { StorybookConfig } from '@storybook/web-components-vite';
import type { Plugin } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const DIST_DIR = resolve(__dirname, '../dist/components');

function distReloadPlugin(): Plugin {
  return {
    name: 'stencil-dist-reload',
    configureServer(server) {
      // Serve dist files directly from disk on every request — bypasses Vite's
      // in-memory transform cache so rebuilds are always reflected immediately.
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/dist/components/') || !url.endsWith('.js')) {
          return next();
        }
        const filePath = resolve(__dirname, '..', url.slice(1));
        try {
          const content = readFileSync(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store');
          res.end(content);
        } catch {
          next();
        }
      });

      // Watch dist dir with Vite's chokidar (FSEvents on macOS — reliable)
      server.watcher.add(DIST_DIR);
      let reloadTimer: ReturnType<typeof setTimeout> | null = null;

      server.watcher.on('change', (filePath) => {
        if (!filePath.startsWith(DIST_DIR) || !filePath.endsWith('.js')) return;
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          server.ws.send({ type: 'full-reload' });
          reloadTimer = null;
        }, 150);
      });
    },
  };
}

const config: StorybookConfig = {
  stories: ['../src/wc/**/*.mdx', '../src/wc/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-toolbars'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  viteFinal: (config) => {
    config.resolve = config.resolve || {};
    const aliases = Array.isArray(config.resolve.alias)
      ? config.resolve.alias
      : [];
    aliases.push({ find: '@', replacement: resolve(__dirname, '../src') });
    config.resolve.alias = aliases;

    // Prevent Vite from pre-bundling dist files so reloads always serve
    // the freshly written file from disk
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = [
      ...(config.optimizeDeps.exclude || []),
      '@ds-mo/ui',
    ];

    config.plugins = [...(config.plugins || []), distReloadPlugin()];

    if (process.env.STORYBOOK_BASE_URL) {
      config.base = process.env.STORYBOOK_BASE_URL;
    }
    return config;
  },
};

export default config;
