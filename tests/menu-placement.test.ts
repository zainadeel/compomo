import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMenuPosition } from '../src/wc/components/Menu/menu-position';
import { PANEL_NAV_USER_MENU_PLACEMENT } from '../src/wc/components/Menu/menu-placement';
import { resolveCssLengthPx } from '../src/wc/utils/resolve-css-length-px';
import { TOKEN_DEFAULTS } from '../src/wc/utils/token-defaults';

describe('PANEL_NAV_USER_MENU_PLACEMENT', () => {
  it('uses right/end with default menu side gap token', () => {
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.side, 'right');
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.align, 'end');
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.sideOffset, 'var(--dimension-space-050)');
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.alignOffset, 0);
  });

  it('resolves sideOffset for menu position math', () => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = ':root { --dimension-space-050: 4px; }';
    document.head.appendChild(style);

    try {
      const sideOffsetPx = resolveCssLengthPx(
        PANEL_NAV_USER_MENU_PLACEMENT.sideOffset,
        TOKEN_DEFAULTS.space050,
      );
      const anchor = { top: 48, left: 0, right: 200, bottom: 80, width: 200, height: 32 };
      const pos = computeMenuPosition({
        anchorRect: anchor,
        popupWidth: 200,
        popupHeight: 240,
        side: PANEL_NAV_USER_MENU_PLACEMENT.side,
        align: PANEL_NAV_USER_MENU_PLACEMENT.align,
        sideOffsetPx,
        alignOffsetPx: PANEL_NAV_USER_MENU_PLACEMENT.alignOffset,
        viewportPadPx: 4,
        viewportWidth: 1200,
        viewportHeight: 800,
      });

      assert.equal(pos.x, 204);
      assert.equal(pos.y, -160);
    } finally {
      style.remove();
    }
  });
});
