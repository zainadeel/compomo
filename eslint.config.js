import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import local from './eslint-plugin-local/index.js';

// eslint-plugin-react (v7) does not support ESLint 10 and is unnecessary here —
// CompoMo is a Stencil web-components library. We keep react-hooks (v7, ESLint
// 10-compatible) for the story files that use React hooks.

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'storybook-static/**', 'scripts/**', 'src/angular/**', 'eslint-plugin-local/**'],
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
      local,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Primitives — warn only (same posture as stylelint). Prefer ds-text / ds-icon.
      'local/prefer-ds-text': 'warn',
      'local/prefer-ds-icon': 'warn',
      'local/prefer-direct-ds-text': 'warn',
      'local/no-selected-fill-emphasis-change': 'warn',
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
  },
);
