import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { clearCssLengthPxCache, resolveCssLengthPx } from '../src/wc/utils/resolve-css-length-px';

describe('resolveCssLengthPx', () => {
  before(() => {
    clearCssLengthPxCache();
  });

  after(() => {
    clearCssLengthPxCache();
  });

  it('passes numbers through unchanged', () => {
    assert.equal(resolveCssLengthPx(12, 0), 12);
    assert.equal(resolveCssLengthPx(0, 8), 0);
  });

  it('parses px strings', () => {
    assert.equal(resolveCssLengthPx('16px', 0), 16);
    assert.equal(resolveCssLengthPx('4px', 0), 4);
    assert.equal(resolveCssLengthPx('-.5px', 0), -0.5);
    assert.equal(resolveCssLengthPx('+1.5e2px', 0), 150);
  });

  it('uses fallback when value is undefined', () => {
    assert.equal(resolveCssLengthPx(undefined, 8), 8);
    assert.equal(resolveCssLengthPx(undefined, '12px'), 12);
  });

  it('keeps server-side layout fallbacks finite without a document', () => {
    assert.equal(resolveCssLengthPx('var(--dimension-space-200)', 16), 16);
    assert.equal(resolveCssLengthPx('calc(1rem + 2px)', '12px'), 12);
    assert.equal(resolveCssLengthPx('1rem', 'var(--dimension-space-100)'), 0);
    assert.equal(resolveCssLengthPx(Number.NaN, 0), 0);
    assert.equal(resolveCssLengthPx(Number.POSITIVE_INFINITY, 0), 0);
  });
});
