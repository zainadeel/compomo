import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/wc/styles/prose.css', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

describe('public prose style contract', () => {
  it('publishes the renderer-neutral stylesheet from compiled output', () => {
    assert.equal(packageJson.exports['./prose.css'], './dist/styles/prose.css');
    assert.ok(packageJson.sideEffects.includes('**/*.css'));
  });

  it('keeps the public selectors override-friendly', () => {
    const selectorsOnly = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutWhereRoots = selectorsOnly
      .replaceAll(':where(.ds-prose)', '')
      .replaceAll(':where(.ds-prose__table-scroll)', '');
    assert.equal(withoutWhereRoots.includes('.ds-prose'), false);
    assert.equal(css.includes('!important'), false);
  });

  it('keeps streaming flow one-directional and append-stable', () => {
    assert.match(css, /margin-block-start/);
    assert.doesNotMatch(css, /:last-child|:empty|:has\(/);
    assert.doesNotMatch(css, /margin-block-end/);
  });

  it('provides a subtree opt-out and a local table overflow owner', () => {
    assert.match(css, /data-ds-prose='off'/);
    assert.match(css, /\.ds-prose__table-scroll/);
    assert.match(css, /overflow-x: auto/);
  });
});
