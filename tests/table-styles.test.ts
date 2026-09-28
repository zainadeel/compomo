import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import valueParser from 'postcss-value-parser';
import {
  assertClassesInWhere,
  assertDeclarations,
  cssImports,
  parseCss,
} from './helpers/css-contracts';

const css = parseCss(fs.readFileSync('src/wc/styles/table.css', 'utf8'));
const componentCss = parseCss(fs.readFileSync('src/wc/components/Table/Table.css', 'utf8'));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Table behavior belongs to the model/controller tests and table*.spec.ts. These
// contracts cover the published CSS recipe independently of its Stencil renderer.
test('publishes one renderer-neutral table recipe consumed by the component', () => {
  assert.equal(packageJson.exports['./table.css'], './dist/styles/table.css');
  const imports = cssImports(componentCss);
  for (const recipe of [
    '../../styles/table.css',
    '../../styles/control-elevation.css',
    '../../utils/text-decoration.css',
  ])
    assert.ok(imports.has(recipe), recipe);
});

test('keeps public table selectors and custom properties override-friendly', () => {
  const classes = assertClassesInWhere(css, 'ds-table');
  for (const name of [
    'header-cell',
    'caption-bar',
    'cell',
    'cell-link',
    'cell-icon-text',
    'cell-tertiary',
    'cell-track--runs',
    'cell--text-wrap',
    'group-content',
    'group-content--multi',
    'group-content--hero',
    'group-primary',
    'group-hero',
    'group-accessories',
    'collapse-all-overlay',
    'sticky-edge',
    'skeleton-row',
    'load-cell',
    'state-cell',
    'elastic-spacer-cell',
    'match',
    'footer',
    'caption-leading',
    'caption-trailing',
  ])
    assert.ok(classes.has(`ds-table__${name}`), `public recipe includes ${name}`);

  const inputs = new Set<string>();
  css.walkDecls(declaration => {
    assert.ok(!declaration.important, `${declaration.prop} must remain overrideable`);
    assert.doesNotMatch(declaration.prop, /^--ds-table-/, 'public overrides must remain inputs');
    valueParser(declaration.value).walk(node => {
      if (node.type !== 'function' || node.value !== 'var') return;
      const name = node.nodes.find(child => child.type === 'word');
      if (name) inputs.add(name.value);
    });
  });
  for (const property of [
    '--ds-table-surface',
    '--ds-table-header-surface',
    '--ds-data-group-surface',
    '--ds-table-row-selected',
    '--ds-table-border',
    '--ds-table-column-border',
    '--ds-table-sticky-border',
    '--ds-table-sticky-start-shadow',
    '--ds-table-sticky-end-shadow',
    '--ds-table-header-min-block-size',
    '--ds-table-row-min-block-size',
    '--ds-table-cell-padding-block',
    '--ds-table-cell-padding-inline',
  ])
    assert.ok(inputs.has(property), `recipe consumes ${property}`);
  assertDeclarations(css, ':where(.ds-table)', {
    '--_table-sticky-border': 'var(--ds-table-sticky-border, var(--color-border-tertiary))',
  });
});

test('shares text track and wrapping tokens with the component stylesheet', () => {
  assertDeclarations(css, ':where(.ds-table)', {
    '--_table-cell-track-min-block-size': 'var(--dimension-size-300)',
    '--_table-wrap-primary-line-height': 'var(--_table-cell-track-min-block-size)',
    '--_table-wrap-secondary-line-height': 'var(--_table-cell-track-min-block-size)',
    '--_table-image-block-size': 'var(--_table-cell-track-min-block-size)',
  });
  for (const [recipe, textSelector, wrapSelector] of [
    [
      css,
      ':where(.ds-table__cell-track--text)',
      ':where(.ds-table__cell--text-wrap .ds-table__cell-track--text)',
    ],
    [
      componentCss,
      'ds-text.ds-table__cell-track--text',
      '.ds-table__cell--text-wrap ds-text.ds-table__cell-track--text',
    ],
  ] as const) {
    assertDeclarations(recipe, textSelector, {
      'padding-inline': 'var(--_table-cell-track-padding-inline)',
    });
    assertDeclarations(recipe, wrapSelector, { display: 'block' });
    for (const [kind, track] of [
      ['single', 'primary'],
      ['multi', 'secondary'],
    ]) {
      const selector = `.ds-table__cell--text-wrap.ds-table__cell--text-${kind} .ds-table__cell-${track}`;
      assertDeclarations(recipe, recipe === css ? `:where(${selector})` : selector, {
        'line-height': `var(--_table-wrap-${track}-line-height)`,
      });
    }
  }
  assertDeclarations(css, ':where(.ds-table__cell-primary)', {
    'padding-block': 'var(--dimension-space-025)',
  });
  assertDeclarations(css, ':where(.ds-table__cell--text-multi .ds-table__cell-copy)', { gap: '0' });
  assertDeclarations(css, ':where(.ds-table__cell-tags)', { gap: '0 var(--dimension-space-050)' });
  assertDeclarations(css, ':where(.ds-table__cell-icon-text)', {
    gap: 'var(--dimension-space-025)',
  });
  assertDeclarations(css, ':where(.ds-table__cell-icon-text-icon)', {
    padding: 'var(--dimension-space-025)',
  });
  assertDeclarations(css, ':where(.ds-table__cell-image)', { 'aspect-ratio': '16 / 9' });
  for (const kind of ['multi', 'triple'])
    assertDeclarations(css, `:where(.ds-table__cell--image-${kind} .ds-table__cell-image)`, {
      'block-size': `var(--_table-image-block-size-${kind})`,
    });
  assertDeclarations(css, ':where(.ds-table__match)', {
    'background-color': 'var(--color-background-faint-brand)',
    color: 'var(--color-foreground-bold-brand)',
  });
});

test('retains scrollable chrome and token-backed group tracks', () => {
  assertDeclarations(css, ':where(.ds-table__viewport)', { overflow: 'auto' });
  assertDeclarations(css, ':where(.ds-table--contained-scroll .ds-table__frame)', {
    overflow: 'clip',
  });
  assertDeclarations(css, ':where(.ds-table__caption-content)', { 'overflow-x': 'auto' });
  for (const part of ['caption-bar', 'footer'])
    assertDeclarations(css, `:where(.ds-table__${part})`, { 'min-inline-size': '0' });
  assertDeclarations(
    css,
    ':where(.ds-table--document-sticky-header.ds-table--caption-visible > .ds-table__caption-bar)',
    {
      position: 'sticky',
      'inset-block-start': 'var(--ds-table-sticky-header-offset, 0)',
    }
  );
  assertDeclarations(css, ':where(.ds-table__group-content--multi)', {
    'align-items': 'flex-start',
    'min-block-size':
      'calc(var(--_table-row-min-block-size) + var(--_table-cell-track-min-block-size))',
  });
  assertDeclarations(css, ':where(.ds-table__group-accessories ds-tooltip)', {
    'align-items': 'center',
    'min-block-size': 'var(--_table-cell-track-min-block-size)',
  });
  // Group alignment, caption controls and sticky/virtual scrolling are measured in table/table-chrome e2e.
});

test('retains explicit focus, forced-colors and reduced-motion fallbacks', () => {
  for (const part of ['header-label--interactive', 'selection-control']) {
    const selector = `:where(.ds-table__${part}:focus-visible)`;
    assertDeclarations(css, selector, {
      outline: 'var(--dimension-stroke-width-025) solid var(--color-interaction-focus)',
    });
    assertDeclarations(css, selector, { 'outline-color': 'var(--ds-forced-color-selected)' }, [
      '@media (forced-colors: active)',
    ]);
  }
  assertDeclarations(css, ':where(.ds-visually-hidden)', {
    position: 'absolute',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
  });
  assertDeclarations(
    css,
    ':where(.ds-table)',
    {
      '--_table-surface': 'var(--ds-forced-color-surface)',
      color: 'var(--ds-forced-color-content)',
    },
    ['@media (forced-colors: active)']
  );
  for (const edge of ['start', 'end'])
    assertDeclarations(css, `:where(.ds-table__cell--sticky-${edge})`, { transition: 'none' }, [
      '@media (prefers-reduced-motion: reduce)',
    ]);
});
