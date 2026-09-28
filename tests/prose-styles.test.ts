import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertClassesInWhere, parseCss } from './helpers/css-contracts';

const css = parseCss(fs.readFileSync('src/wc/styles/prose.css', 'utf8'));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

describe('public prose style contract', () => {
  it('exports the renderer-neutral stylesheet and preserves CSS side effects', () => {
    assert.equal(packageJson.exports['./prose.css'], './dist/styles/prose.css');
    assert.ok(packageJson.sideEffects.includes('**/*.css'));
  });

  it('keeps public recipe classes override-friendly', () => {
    const classes = assertClassesInWhere(css, 'ds-prose');
    assert.ok(classes.has('ds-prose'));
    assert.ok(classes.has('ds-prose__table-scroll'));
    css.walkDecls(declaration => {
      assert.ok(!declaration.important);
    });
    // prose.spec.ts owns streaming stability, subtree opt-out, text measure and overflow.
  });
});
