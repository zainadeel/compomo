import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  CONTROL_SUPPORTING_TEXT_VARIANT,
  CONTROL_TEXT_VARIANT,
} from '../src/wc/utils/control-text';
import { assertDeclarations, cssRules, parseCss } from './helpers/css-contracts';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const styles = (relativePath: string) => parseCss(read(relativePath));
const densities = [
  { size: 'lg', height: '500', padding: '100', label: '050', gap: '050' },
  { size: 'md', height: '400', padding: '075', label: '025', gap: '050' },
  { size: 'sm', height: '300', padding: '050', label: '025', gap: '025' },
  { size: 'xs', height: '200', padding: '025', label: '025', gap: null },
];

test('every control density resolves a complete token recipe and the shared radius', () => {
  const css = styles('src/wc/utils/control-density.css');
  for (const { size, height, padding, label, gap } of densities) {
    for (const selector of [`.ds-control--${size}`, `:host(.ds-control--${size})`])
      assertDeclarations(css, selector, {
        '--ds-control-radius': 'var(--ds-radius-control)',
        '--ds-control-height': `var(--dimension-size-${height})`,
        '--ds-control-icon': `var(--dimension-iconography-${size})`,
        '--ds-control-padding-inline': `var(--dimension-space-${padding})`,
        '--ds-control-label-inset': `var(--dimension-space-${label})`,
        '--ds-control-gap': gap ? `var(--dimension-space-${gap})` : '0',
      });
  }
});

test('inset density reduces only same-size outer geometry', () => {
  const css = styles('src/wc/utils/control-density-inset.css');
  for (const { size, height, padding } of densities) {
    for (const [depth, heightInset, paddingInset] of [
      ['inset', '050', '025'],
      ['inset-double', '100', '050'],
    ]) {
      for (const selector of [
        `.ds-control--${size}.ds-control--${depth}`,
        `:host(.ds-control--${size}.ds-control--${depth})`,
      ]) {
        if (size === 'xs' && depth === 'inset-double') {
          assert.equal(cssRules(css, selector).length, 0);
          continue;
        }
        assertDeclarations(css, selector, {
          '--ds-control-height': `calc(var(--dimension-size-${height}) - var(--dimension-space-${heightInset}))`,
          '--ds-control-padding-inline': `calc(var(--dimension-space-${padding}) - var(--dimension-space-${paddingInset}))`,
        });
      }
    }
  }
  css.walkDecls(declaration => {
    assert.doesNotMatch(declaration.prop, /^--ds-control-(?:icon|label-inset|gap|radius)$/);
  });
});

test('choice rows derive primary and supporting type from control density', () => {
  assert.deepEqual(CONTROL_TEXT_VARIANT, {
    lg: 'text-body-large',
    md: 'text-body-medium',
    sm: 'text-body-small',
    xs: 'text-caption',
  });
  assert.deepEqual(CONTROL_SUPPORTING_TEXT_VARIANT, {
    lg: 'text-body-medium',
    md: 'text-body-small',
    sm: 'text-caption',
    xs: 'text-caption',
  });
});
