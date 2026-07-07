import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMenuPosition } from '../src/wc/components/Menu/menu-position';
import { PANEL_NAV_USER_MENU_PLACEMENT } from '../src/wc/components/Menu/menu-placement';
import { resolveCssLengthPx } from '../src/wc/utils/resolve-css-length-px';
import { TOKEN_CSS_LENGTHS } from '../src/wc/utils/token-defaults';

describe('PANEL_NAV_USER_MENU_PLACEMENT', () => {
  it('uses right/end with content-area offsets', () => {
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.side, 'right');
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.align, 'end');
    assert.equal(
      PANEL_NAV_USER_MENU_PLACEMENT.sideOffset,
      'calc(var(--dimension-space-100) + var(--dimension-space-050))',
    );
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.alignOffset, TOKEN_CSS_LENGTHS.space050);
    assert.equal(PANEL_NAV_USER_MENU_PLACEMENT.alignOffset, 'var(--dimension-space-050)');
  });

  it('resolves offsets for menu position math', () => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent =
      ':root { --dimension-space-base: 8px; --dimension-space-050: calc(var(--dimension-space-base) / 2); --dimension-space-100: var(--dimension-space-base); }';
    document.head.appendChild(style);

    try {
      const sideOffsetPx = resolveCssLengthPx(
        PANEL_NAV_USER_MENU_PLACEMENT.sideOffset,
        TOKEN_CSS_LENGTHS.space050,
      );
      const alignOffsetPx = resolveCssLengthPx(
        PANEL_NAV_USER_MENU_PLACEMENT.alignOffset,
        TOKEN_CSS_LENGTHS.space050,
      );
      assert.equal(sideOffsetPx, 12);
      assert.equal(alignOffsetPx, 4);

      const anchor = { top: 48, left: 44, right: 192, bottom: 80, width: 148, height: 32 };
      const pos = computeMenuPosition({
        anchorRect: anchor,
        popupWidth: 200,
        popupHeight: 240,
        side: PANEL_NAV_USER_MENU_PLACEMENT.side,
        align: PANEL_NAV_USER_MENU_PLACEMENT.align,
        sideOffsetPx,
        alignOffsetPx,
        viewportPadPx: 4,
        viewportWidth: 1200,
        viewportHeight: 800,
      });

      assert.equal(pos.x, 204); // anchor.right (192) + 12px = 4px past panel at 200
      assert.equal(pos.y, -156); // bottom (80) - height (240) + alignOffset (4)
    } finally {
      style.remove();
    }
  });
});
