import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCssLengthPx } from '../src/wc/utils/resolve-css-length-px';
import { TOKEN_DEFAULTS } from '../src/wc/utils/token-defaults';

describe('overlay positioning with token offsets', () => {
  it('resolves sideOffset token string to px for layout math', () => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = ':root { --dimension-space-200: 16px; --dimension-space-050: 4px; }';
    document.head.appendChild(style);

    try {
      const sideOffsetPx = resolveCssLengthPx(
        'var(--dimension-space-200)',
        TOKEN_DEFAULTS.space050,
      );
      const vpPad = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);

      assert.equal(sideOffsetPx, 16);
      assert.equal(vpPad, 4);

      const anchorRight = 100;
      const popupX = anchorRight + sideOffsetPx;
      assert.equal(popupX, 116);
    } finally {
      style.remove();
    }
  });
});
