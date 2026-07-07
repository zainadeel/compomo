import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { clearCssLengthPxCache, resolveCssLengthPx } from '../src/wc/utils/resolve-css-length-px';
import { TOKEN_CSS_LENGTHS, TOKEN_DEFAULTS } from '../src/wc/utils/token-defaults';

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
  });

  it('uses fallback when value is undefined', () => {
    assert.equal(resolveCssLengthPx(undefined, 8), 8);
    assert.equal(resolveCssLengthPx(undefined, '12px'), 12);
  });

  it('resolves var(--dimension-space-200) via probe when DOM is available', () => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = ':root { --dimension-space-200: 16px; --dimension-space-050: 4px; }';
    document.head.appendChild(style);

    try {
      clearCssLengthPxCache();
      const px = resolveCssLengthPx(TOKEN_DEFAULTS.space200, TOKEN_CSS_LENGTHS.space050);
      assert.equal(px, 16);
    } finally {
      style.remove();
    }
  });

  it('wraps bare custom-property names in var() for probe resolution', () => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = ':root { --dimension-space-050: 4px; }';
    document.head.appendChild(style);

    try {
      clearCssLengthPxCache();
      assert.equal(resolveCssLengthPx(TOKEN_DEFAULTS.space050, 0), 4);
      assert.equal(resolveCssLengthPx(TOKEN_CSS_LENGTHS.space050, 0), 4);
    } finally {
      style.remove();
    }
  });
});
