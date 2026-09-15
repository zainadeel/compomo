// Configured CSS policy, preserved during the ESLint migration.
export default {
  'local/no-ds-text-metric-overrides': [true],
  'local/no-raw-opacity': [
    true,
    {
      severity: 'error',
    },
  ],
  'local/require-reduced-motion': [true],
  'color-no-hex': [
    true,
    {
      severity: 'warning',
    },
  ],
  'color-named': [
    'never',
    {
      severity: 'warning',
    },
  ],
  'declaration-property-value-disallowed-list': [
    {
      '/^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(-|$)/': [
        '/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/',
      ],
      '/^(min-|max-)?(width|height)$/': [
        '/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/',
      ],
      '/^(min-|max-)?height$/': ['/--dimension-(card|modal|menu|panel)-width/'],
      '/^border(-(top|right|bottom|left))?(-[a-z]+)?-radius$/': [
        '/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/',
      ],
      '/^border(-(top|right|bottom|left))?(-width)?$/': [
        '/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/',
      ],
      'outline-width': ['/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/'],
      'stroke-width': ['/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/'],
      'font-size': ['/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/'],
      'line-height': ['/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/'],
      'letter-spacing': ['/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)(px|rem|em)\\b/'],
      'font-weight': ['/^[1-9]00$/'],
      'font-family': [
        '/^(Arial|Helvetica|Times|Georgia|system-ui|sans-serif|serif|monospace)\\b/i',
      ],
      '/^(transition|animation)(-|$)/': ['/(?<!\\d)(?<!,\\s-?)(?:[1-9]\\d*|0\\.[0-9]+)m?s\\b/'],
    },
    {
      severity: 'warning',
    },
  ],
  'at-rule-empty-line-before': [
    'always',
    {
      except: ['blockless-after-same-name-blockless', 'first-nested'],
      ignore: ['after-comment'],
    },
  ],
  'at-rule-no-vendor-prefix': [true],
  'block-no-redundant-nested-style-rules': [true],
  'color-hex-length': ['short'],
  'comment-whitespace-inside': ['always'],
  'container-name-pattern': ['^(--)?([a-z][a-z0-9]*)(-[a-z0-9]+)*$', {}],
  'custom-media-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', {}],
  'font-family-name-quotes': ['always-where-recommended'],
  'function-name-case': ['lower'],
  'function-url-quotes': ['always'],
  'keyframe-selector-notation': ['percentage-unless-within-keyword-only-block'],
  'layer-name-pattern': ['^([a-z][a-z0-9]*)([.-][a-z0-9]+)*$', {}],
  'length-zero-no-unit': [
    true,
    {
      ignore: ['custom-properties'],
    },
  ],
  'lightness-notation': ['percentage'],
  'media-feature-name-no-vendor-prefix': [true],
  'number-max-precision': [4],
  'selector-attribute-quotes': ['always'],
  'selector-no-vendor-prefix': [true],
  'selector-pseudo-element-colon-notation': ['double'],
  'selector-type-case': ['lower'],
  'shorthand-property-no-redundant-values': [true],
  'value-no-vendor-prefix': [
    true,
    {
      ignoreValues: ['box', 'inline-box'],
    },
  ],
  'annotation-no-unknown': [true],
  'at-rule-descriptor-no-unknown': [true],
  'at-rule-descriptor-value-no-unknown': [true],
  'at-rule-no-deprecated': [true],
  'at-rule-no-unknown': [true],
  'at-rule-prelude-no-invalid': [
    true,
    {
      ignoreAtRules: ['media'],
    },
  ],
  'comment-no-empty': [true],
  'custom-property-no-missing-var-function': [true],
  'declaration-block-no-duplicate-custom-properties': [true],
  'declaration-block-no-duplicate-properties': [
    true,
    {
      ignore: ['consecutive-duplicates-with-different-syntaxes'],
    },
  ],
  'declaration-block-no-shorthand-property-overrides': [true],
  'declaration-property-value-no-unknown': [true],
  'font-family-no-duplicate-names': [true],
  'font-family-no-missing-generic-family-keyword': [true],
  'function-calc-no-unspaced-operator': [true],
  'keyframe-block-no-duplicate-selectors': [true],
  'keyframe-declaration-no-important': [true],
  'media-feature-name-no-unknown': [true],
  'media-feature-name-value-no-unknown': [true],
  'media-query-no-invalid': [true],
  'media-type-no-deprecated': [true],
  'named-grid-areas-no-invalid': [true],
  'nesting-selector-no-missing-scoping-root': [true],
  'no-duplicate-at-import-rules': [true],
  'no-empty-source': [true],
  'no-invalid-double-slash-comments': [true],
  'no-invalid-position-at-import-rule': [true],
  'no-invalid-position-declaration': [true],
  'no-irregular-whitespace': [true],
  'property-no-unknown': [true],
  'selector-anb-no-unmatchable': [true],
  'selector-pseudo-class-no-unknown': [true],
  'selector-pseudo-element-no-unknown': [true],
  'selector-type-no-unknown': [
    true,
    {
      ignore: ['custom-elements'],
    },
  ],
  'string-no-newline': [
    true,
    {
      ignore: ['at-rule-preludes', 'declaration-values'],
    },
  ],
  'syntax-string-no-invalid': [true],
};
