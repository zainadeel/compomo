import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { createConfig } from './lint/index.js';
import authoring from './scripts/authoring-rules.mjs';

// eslint-plugin-react (v7) does not support ESLint 10 and is unnecessary here —
// CompoMo is a Stencil web-components library. We keep react-hooks (v7, ESLint
// 10-compatible) for the story files that use React hooks.

const sourceConfig = tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'storybook-static/**',
      'scripts/**',
      'src/.generated/**',
      'src/angular/**',
      'lint/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          // Stencil's JSX transform consumes the imported h factory even
          // though the TypeScript ESTree scope analyzer cannot observe it.
          varsIgnorePattern: '^(?:_|h$)',
        },
      ],
    },
  },
  {
    // Story files are doc scaffolding, not shipped library code. They set
    // Stencil web-component properties (.items, .options, .value) imperatively
    // via lit `ref` callbacks or getElementById — the canonical lit + Stencil +
    // Storybook idiom, where casting the element to `any` to reach those props
    // is expected and harmless. Relax `no-explicit-any` here only.
    files: ['src/**/*.stories.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  }
);

export default [
  {
    files: ['src/wc/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.ts', '**/*.stories.tsx'],
    plugins: { 'compomo-authoring': authoring },
    rules: {
      'compomo-authoring/no-markup-sinks': 'error',
      'compomo-authoring/component-conventions': 'error',
    },
  },
  ...sourceConfig.map(config =>
    config.files || (Object.keys(config).length === 1 && config.ignores)
      ? config
      : { ...config, files: ['**/*.{js,jsx,ts,tsx}'] }
  ),
  ...createConfig({
    mode: 'authoring',
    cssFiles: ['src/wc/components/**/*.css', 'src/wc/styles/**/*.css', 'src/wc/utils/**/*.css'],
    jsxFiles: ['src/**/*.{ts,tsx}'],
  }),
];
