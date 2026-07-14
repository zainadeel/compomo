import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTooltipPosition } from '../src/wc/components/Tooltip/tooltip-position';

const base = {
  anchorRect: { top: 100, left: 100, right: 140, bottom: 124, width: 40, height: 24 },
  popupWidth: 80,
  popupHeight: 32,
  align: 'center' as const,
  sideOffsetPx: 4,
  alignOffsetPx: 0,
  viewportPadPx: 4,
  viewportWidth: 400,
  viewportHeight: 300,
};

describe('computeTooltipPosition', () => {
  it('uses the requested side when it fits', () => {
    assert.deepEqual(computeTooltipPosition({ ...base, side: 'top' }), {
      x: 80,
      y: 64,
      resolvedSide: 'top',
    });
  });

  it('flips from top to bottom near the viewport edge', () => {
    const position = computeTooltipPosition({
      ...base,
      anchorRect: { top: 2, left: 100, right: 140, bottom: 26, width: 40, height: 24 },
      side: 'top',
    });

    assert.equal(position.resolvedSide, 'bottom');
    assert.equal(position.y, 30);
  });

  it('flips from right to left when the preferred side overflows', () => {
    const position = computeTooltipPosition({
      ...base,
      anchorRect: { top: 100, left: 360, right: 396, bottom: 124, width: 36, height: 24 },
      side: 'right',
    });

    assert.equal(position.resolvedSide, 'left');
    assert.equal(position.x, 276);
  });

  it('clamps the alignment axis after resolving the side', () => {
    const position = computeTooltipPosition({
      ...base,
      anchorRect: { top: 100, left: 0, right: 24, bottom: 124, width: 24, height: 24 },
      side: 'bottom',
      align: 'start',
      alignOffsetPx: -20,
    });

    assert.equal(position.x, 4);
    assert.equal(position.resolvedSide, 'bottom');
  });

  it('keeps viewport padding when the popup is larger than the viewport', () => {
    const position = computeTooltipPosition({
      ...base,
      popupWidth: 500,
      popupHeight: 400,
      side: 'top',
    });

    assert.equal(position.x, 4);
    assert.equal(position.y, 4);
  });
});
