/**
 * CompoMo CSS lint — TokoMo token category coverage + high-signal disallows.
 * All findings are warnings (exit 0) so CI stays green while we burn down backlog.
 *
 * @type {import('stylelint').Config}
 */

/**
 * Non-zero px/rem/em outside `var(--token, …)` fallbacks.
 * `(?<!,\\s-?)` skips TokoMo fallbacks like `var(--dimension-size-600, 48px)`
 * and negative ones like `var(--dimension-space-n050, -4px)`.
 */
const RAW_LENGTH = '/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/';

/** Non-zero CSS times outside `var(--effect-*, …)` fallbacks. */
const RAW_TIME = '/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)m?s\\b/';

export default {
  extends: ['stylelint-config-standard'],
  defaultSeverity: 'warning',
  ignoreFiles: [
    '**/dist/**',
    '**/node_modules/**',
    '**/storybook-static/**',
    '**/public/**',
  ],
  rules: {
    // ── Turn off stylistic / browser-compat noise (not token coverage) ──
    'alpha-value-notation': null,
    'block-no-empty': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'comment-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-block-single-line-max-declarations': null,
    'declaration-empty-line-before': null,
    'declaration-property-value-keyword-no-deprecated': null,
    'hue-degree-notation': null,
    'import-notation': null,
    'keyframes-name-pattern': null,
    'media-feature-range-notation': null,
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'property-no-deprecated': null,
    'property-no-vendor-prefix': null,
    'rule-empty-line-before': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'selector-not-notation': null,
    'value-keyword-case': null,

    // ── Category: color — no raw hex / named colors (use --color-* tokens) ──
    'color-no-hex': [true, { severity: 'warning' }],
    'color-named': ['never', { severity: 'warning' }],

    // ── Category coverage + high-signal disallows ──
    // Raw length/time on tokenized properties → prefer TokoMo vars.
    // Component width tokens must never drive height / min-height / max-height.
    'declaration-property-value-disallowed-list': [
      {
        // Space
        '/^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(-|$)/': [
          RAW_LENGTH,
        ],
        // Size (width / height / min- / max-)
        '/^(min-|max-)?(width|height)$/': [RAW_LENGTH],
        // Width tokens used as height (the CardSetting / CardDataViz bug class)
        '/^(min-|max-)?height$/': [
          '/--dimension-(card|modal|menu|panel)-width/',
        ],
        // Radius
        '/^border(-(top|right|bottom|left))?(-[a-z]+)?-radius$/': [RAW_LENGTH],
        // Stroke / border width (shorthand + longhand)
        '/^border(-(top|right|bottom|left))?(-width)?$/': [RAW_LENGTH],
        'outline-width': [RAW_LENGTH],
        'stroke-width': [RAW_LENGTH],
        // Typography
        'font-size': [RAW_LENGTH],
        'line-height': [RAW_LENGTH],
        'letter-spacing': [RAW_LENGTH],
        'font-weight': ['/^[1-9]00$/'],
        'font-family': [
          '/^(Arial|Helvetica|Times|Georgia|system-ui|sans-serif|serif|monospace)\\b/i',
        ],
        // Motion — allow 0ms/0s; flag non-zero raw times (not var fallbacks)
        '/^(transition|animation)(-|$)/': [RAW_TIME],
      },
      { severity: 'warning' },
    ],
  },
};
