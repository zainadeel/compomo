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

  it('flips bottom placement to top when the preferred side does not fit', () => {
    const pos = computeMenuPosition({
      anchorRect: { top: 260, left: 80, right: 180, bottom: 292, width: 100, height: 32 },
      popupWidth: 180,
      popupHeight: 120,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: 8,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 500,
      viewportHeight: 320,
    });

    assert.equal(pos.x, 80);
    assert.equal(pos.y, 132);
  });

  it('flips right placement to left when the preferred side does not fit', () => {
    const pos = computeMenuPosition({
      anchorRect: { top: 80, left: 420, right: 452, bottom: 112, width: 32, height: 32 },
      popupWidth: 200,
      popupHeight: 120,
      side: 'right',
      align: 'start',
      sideOffsetPx: 12,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 480,
      viewportHeight: 320,
    });

    assert.equal(pos.x, 208);
    assert.equal(pos.y, 80);
  });

  it('keeps the preferred side when it fits even if the opposite side is larger', () => {
    const pos = computeMenuPosition({
      anchorRect: { top: 200, left: 80, right: 180, bottom: 232, width: 100, height: 32 },
      popupWidth: 180,
      popupHeight: 60,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: 8,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 500,
      viewportHeight: 320,
    });

    assert.equal(pos.y, 240);
  });

  it('keeps oversized popups pinned to viewport padding', () => {
    const pos = computeMenuPosition({
      anchorRect: anchor,
      popupWidth: 600,
      popupHeight: 500,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: 8,
      alignOffsetPx: 0,
      viewportPadPx: 8,
      viewportWidth: 400,
      viewportHeight: 300,
    });

    assert.deepEqual(pos, { x: 8, y: 8 });
  });
});
