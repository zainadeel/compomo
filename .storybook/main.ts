import type { StorybookConfig } from '@storybook/web-components-vite';
import { resolve } from 'path';

const config: StorybookConfig = {
  stories: ['../src/wc/**/*.mdx', '../src/wc/**/*.stories.@(ts|tsx)'],
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

    if (process.env.STORYBOOK_BASE_URL) {
      config.base = process.env.STORYBOOK_BASE_URL;
    }
    return config;
  },
};

export default config;
