import css from '@eslint/css';
import cssRules from './css/plugin.js';
import settings from './css/settings.js';
import jsx from './jsx-rules.js';
import contracts from './contracts.js';
import { cssContractRule, jsxContractRule } from './contract-rules.js';

/** @type {import('eslint').ESLint.Plugin} */
export const plugin = {
  meta: { name: '@ds-mo/ui/lint' },
  rules: {
    ...cssRules,
    ...jsx.rules,
    'no-component-restyle': cssContractRule(contracts),
    'no-component-inline-restyle': jsxContractRule(contracts),
  },
};

/**
 * Add CompoMo policy to an existing ESLint flat config. The application owns its
 * JS/TS parser. Empty file selections disable that language's preset.
 * @param {import('./types.js').LintOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export function createConfig(options = {}) {
  const {
    mode = 'consumer',
    strict = false,
    cssFiles = ['**/*.css'],
    jsxFiles = ['**/*.{js,jsx,ts,tsx}'],
    ignores = [],
  } = options;
  if (!['authoring', 'consumer'].includes(mode))
    throw new TypeError('Unknown CompoMo lint mode: ' + mode);
  const authoring = mode === 'authoring';
  const result = [];
  if (cssFiles.length) {
    const rules = Object.fromEntries(
      Object.entries(settings).map(([name, entry]) => {
        const [primary, secondary = {}] = entry;
        const { severity = 'warning', ...opts } = secondary;
        return [
          'compomo/' + name.replace('local/', ''),
          [
            authoring ? (severity === 'error' ? 'error' : 'warn') : strict ? 'error' : 'warn',
            primary,
            ...(Object.keys(opts).length ? [opts] : []),
          ],
        ];
      })
    );
    // Consumer typography is checked once by the selector-aware contract rule.
    if (!authoring) {
      delete rules['compomo/no-ds-text-metric-overrides'];
      rules['compomo/no-component-restyle'] = strict ? 'error' : 'warn';
    }
    result.push({
      name: 'compomo/' + mode + '/css',
      files: cssFiles,
      ignores,
      language: 'css/css',
      languageOptions: { tolerant: true },
      linterOptions: { reportUnusedDisableDirectives: 'off' },
      plugins: { css, compomo: plugin },
      rules,
    });
  }
  if (jsxFiles.length) {
    const rules = Object.fromEntries(
      Object.keys(jsx.rules).map(name => [
        'compomo/' + name,
        strict && !authoring ? 'error' : 'warn',
      ])
    );
    if (!authoring) rules['compomo/no-component-inline-restyle'] = strict ? 'error' : 'warn';
    result.push({
      name: 'compomo/' + mode + '/jsx',
      files: jsxFiles,
      ignores,
      plugins: { compomo: plugin },
      settings: { compomo: { mode } },
      rules,
    });
  }
  return result;
}
