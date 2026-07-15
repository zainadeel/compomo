import type { StorybookConfig } from '@storybook/web-components-vite';
import type { Plugin, ViteDevServer } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const DIST_DIR = resolve(PROJECT_ROOT, 'dist/components');
const DIST_STAMP = resolve(PROJECT_ROOT, 'dist/.build-stamp');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');
const PACKAGE_VERSION_JSON = resolve(PROJECT_ROOT, '.storybook/static/package-version.json');

const RELOAD_DEBOUNCE_MS = 350;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function isStencilDistOutput(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return (
    normalized.startsWith(normalizePath(DIST_DIR)) ||
    normalized === normalizePath(DIST_STAMP)
  );
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

      const onDistFileEvent = (filePath: string) => {
        if (!isStencilDistOutput(filePath)) return;

        if (filePath.endsWith('.js')) {
          for (const mod of server.moduleGraph.getModulesByFile(filePath) ?? []) {
            server.moduleGraph.invalidateModule(mod);
          }
        }

        const reason = filePath.endsWith('.build-stamp')
          ? 'build complete'
          : filePath.split(/[/\\]/).pop() ?? 'dist';
        scheduleFullReload(reason);
      };

      const onPackageVersionEvent = (filePath: string) => {
        const normalized = normalizePath(filePath);
        if (
          normalized !== normalizePath(PACKAGE_JSON) &&
          normalized !== normalizePath(PACKAGE_VERSION_JSON)
        ) {
          return;
        }
        scheduleFullReload('package version');
      };

      server.watcher.on('add', onDistFileEvent);
      server.watcher.on('change', onDistFileEvent);
      server.watcher.on('unlink', onDistFileEvent);
      server.watcher.on('change', onPackageVersionEvent);

      // dist/ is gitignored — must opt in explicitly (watch.ignored below also allows it).
      server.watcher.add(DIST_DIR);
      server.watcher.add(DIST_STAMP);
      server.watcher.add(PACKAGE_JSON);
      server.watcher.add(PACKAGE_VERSION_JSON);
    },
  };
}

const config: StorybookConfig = {
  stories: [
    '../src/docs/**/*.mdx',
    '../src/wc/**/*.mdx',
    '../src/wc/**/*.stories.@(ts|tsx)',
  ],
  staticDirs: ['./static'],
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

    // dist/ is in .gitignore — Vite's default watcher skips it unless we allow it here.
    config.server.watch = {
      ...config.server.watch,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      ignored: (filePath: string) => {
        const normalized = normalizePath(filePath);
        if (isStencilDistOutput(normalized)) return false;
        if (normalized.includes('/node_modules/')) return true;
        if (normalized.includes('/.git/')) return true;
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
