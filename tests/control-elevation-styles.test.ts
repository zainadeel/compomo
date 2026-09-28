import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertDeclarations, cssDeclarations, parseCss } from './helpers/css-contracts';

const css = parseCss(fs.readFileSync('src/wc/styles/control-elevation.css', 'utf8'));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

describe('public control elevation style contract', () => {
  it('exports the stylesheet and preserves CSS side effects', () => {
    assert.equal(
      packageJson.exports['./control-elevation.css'],
      './dist/styles/control-elevation.css'
    );
    assert.ok(packageJson.sideEffects.includes('**/*.css'));
    // verify:pack executes the build/package checks rather than inspecting their scripts.
  });

  it('splits every supported level into an outer shadow and a top highlight', () => {
    for (const level of ['sm', 'md', 'floating'])
      assertDeclarations(css, `.ds-control-elevation--${level}`, {
        '--ds-control-elevation-shadow': `var(--effect-shadow-elevated-${level})`,
        '--ds-control-elevation-highlight': `var(--effect-highlight-elevated-${level})`,
      });
    assertDeclarations(css, '.ds-control-elevation::after', {
      'z-index': '4',
      'border-radius': 'inherit',
      'pointer-events': 'none',
    });
  });

  it('keeps resting wrappers untransformed and respects reduced motion', () => {
    const resting = '.ds-control-elevation--press-scale';
    const pressed = `${resting}[data-ds-press-active]`;
    assertDeclarations(css, resting, {
      '--ds-control-press-active-scale': 'var(--dimension-scale-default)',
      transition: 'scale var(--effect-motion-short-2)',
    });
    assert.ok(!cssDeclarations(css, resting).has('scale'));
    assertDeclarations(css, pressed, { scale: 'var(--dimension-scale-subtle)' });
    assertDeclarations(css, pressed, { scale: 'none', transition: 'none' }, [
      '@media (prefers-reduced-motion: reduce)',
    ]);
  });
});
