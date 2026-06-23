import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMenuPosition } from '../src/wc/components/Menu/menu-position';

describe('computeMenuPosition', () => {
  const anchor = { top: 100, left: 40, right: 180, bottom: 132, width: 140, height: 32 };

  it('places menu to the right with end alignment', () => {
    const pos = computeMenuPosition({
      anchorRect: anchor,
      popupWidth: 200,
      popupHeight: 120,
      side: 'right',
      align: 'end',
      sideOffsetPx: 16,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 1200,
      viewportHeight: 800,
    });

    assert.equal(pos.x, 196);
    assert.equal(pos.y, 12);
  });

  it('places menu below with start alignment', () => {
    const pos = computeMenuPosition({
      anchorRect: anchor,
      popupWidth: 200,
      popupHeight: 120,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: 8,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 1200,
      viewportHeight: 800,
    });

    assert.equal(pos.x, 40);
    assert.equal(pos.y, 140);
  });

  it('clamps to viewport padding', () => {
    const pos = computeMenuPosition({
      anchorRect: { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 },
      popupWidth: 200,
      popupHeight: 120,
      side: 'right',
      align: 'end',
      sideOffsetPx: 0,
      alignOffsetPx: 0,
      viewportPadPx: 8,
      viewportWidth: 400,
      viewportHeight: 300,
    });

    assert.equal(pos.x, 8);
    assert.equal(pos.y, 8);
  });
});
