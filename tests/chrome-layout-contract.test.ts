import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { assertDeclarations, cssDeclarations, cssImports, parseCss } from './helpers/css-contracts';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const styles = (relativePath: string) => parseCss(read(relativePath));

test('chrome spacing defines token padding and gap with an optional small-padding override', () => {
  const css = styles('src/wc/utils/chrome-layout.css');
  for (const [size, token] of Object.entries({ sm: '050', md: '100', lg: '200' })) {
    const padding =
      size === 'sm'
        ? `var(--ds-chrome-space-sm-padding, var(--dimension-space-${token}))`
        : `var(--dimension-space-${token})`;
    for (const selector of [`.ds-chrome-space--${size}`, `:host(.ds-chrome-space--${size})`])
      assertDeclarations(css, selector, {
        '--ds-chrome-padding': padding,
        '--ds-chrome-gap': `var(--dimension-space-${token})`,
      });
  }
  css.walkDecls(declaration => {
    assert.doesNotMatch(declaration.prop, /^(?:min-|max-)?(?:width|height)$/);
  });
  for (const layout of ['row', 'column', 'grid']) {
    assertDeclarations(css, `.ds-chrome-${layout}`, {
      display: layout === 'grid' ? 'grid' : 'flex',
      'box-sizing': 'border-box',
      ...(layout === 'grid' ? {} : { 'flex-direction': layout }),
      ...(layout === 'column' ? {} : { 'align-items': 'center' }),
    });
  }
});

test('compact headers share token geometry for copy zones', () => {
  const css = styles('src/wc/utils/chrome-header.css');
  assert.ok(cssImports(css).has('./control-density.css'));
  assertDeclarations(css, '.ds-chrome-header', {
    'min-block-size': 'var(--dimension-size-600)',
    padding: 'var(--dimension-space-100)',
    gap: 'var(--dimension-space-100)',
  });
  assertDeclarations(css, '.ds-chrome-header--bounded', {
    'border-block-end': 'var(--dimension-stroke-width-012) solid var(--color-border-tertiary)',
  });
  assertDeclarations(css, '.ds-chrome-header__copy', {
    padding: 'var(--ds-control-padding-inline, var(--dimension-space-075))',
  });
  for (const part of ['heading', 'description'])
    assertDeclarations(css, `.ds-chrome-header__${part}`, {
      'padding-inline': 'var(--ds-control-label-inset, var(--dimension-space-025))',
    });
  assertDeclarations(css, '.ds-chrome-header__copy--wrapping', {
    'column-gap': 'var(--dimension-space-100)',
    'row-gap': 'var(--dimension-space-050)',
  });
  assertDeclarations(css, '.ds-chrome-header__copy--stacked', {
    'flex-direction': 'column',
    gap: 'var(--dimension-space-050)',
  });
});
