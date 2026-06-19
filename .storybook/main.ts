import type { StorybookConfig } from '@storybook/web-components-vite';
import type { Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Storybook 10 loads this config as ESM — __dirname is not available in ESM
// scope, so we derive it from import.meta.url instead.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '../dist/components');

function distReloadPlugin(): Plugin {
  return {
    name: 'stencil-dist-reload',
    configureServer(server) {
      // Let Vite transform dist/component imports so externalized @ds-mo/icons
      // specifiers resolve. Watch dist and full-reload when Stencil rebuilds.
      server.watcher.add(DIST_DIR);
      let reloadTimer: ReturnType<typeof setTimeout> | null = null;

      const invalidateDistModule = (filePath: string) => {
        if (!filePath.startsWith(DIST_DIR) || !filePath.endsWith('.js')) return;

        // Storybook stories import built dist files directly. When Stencil rewrites
        // those files, invalidate by source file path and then clear the broader
        // transform graph so Vite doesn't keep serving a stale transformed module.
        for (const mod of server.moduleGraph.getModulesByFile(filePath) || []) {
          server.moduleGraph.invalidateModule(mod);
        }
        server.moduleGraph.invalidateAll();

        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          server.ws.send({ type: 'full-reload' });
          reloadTimer = null;
        }, 150);
      };

      server.watcher.on('add', invalidateDistModule);
      server.watcher.on('change', invalidateDistModule);
      server.watcher.on('unlink', invalidateDistModule);
    },
  };
}

const config: StorybookConfig = {
  stories: ['../src/wc/**/*.mdx', '../src/wc/**/*.stories.@(ts|tsx)'],
  // Toolbars are built into Storybook core since v9 (the standalone
  // @storybook/addon-toolbars no longer exists). The theme / anim-speed
  // toolbars in preview.ts are driven by globalTypes, which core renders.
  addons: ['@storybook/addon-docs'],
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

    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    const projectRoot = resolve(__dirname, '..');
    config.server.fs.allow = [
      ...(config.server.fs.allow || []),
      projectRoot,
      resolve(projectRoot, 'dist'),
    ];

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
