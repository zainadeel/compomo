import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnchoredPosition,
  type AnchoredAlign,
  type AnchoredPositionInput,
  type AnchoredSide,
} from '../src/wc/utils/anchored-position';

const SIDES: AnchoredSide[] = ['top', 'right', 'bottom', 'left'];
const ALIGNS: AnchoredAlign[] = ['start', 'center', 'end'];

const OPPOSITE_SIDE: Record<AnchoredSide, AnchoredSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/**
 * The pre-merge `computeAnchoredPopupPosition` flip rule, kept verbatim as a
 * reference oracle. It decided by comparing *available space* per side, whereas
 * the shipped implementation compares *actual overflow* of each candidate rect.
 *
 * Menu and both Select modes ran on this variant while Tooltip and Toast ran
 * on the overflow variant. The sweep below asserts the two agree exactly, which
 * is what made consolidating them safe — keep it green so a future change to the
 * flip rule cannot silently move menus or selects.
 */
function legacySpaceBasedFlipSide(input: AnchoredPositionInput): AnchoredSide {
  const availableMainAxisSpace = (side: AnchoredSide): number => {
    const { anchorRect: a, sideOffsetPx, viewportPadPx, viewportWidth, viewportHeight } = input;
    switch (side) {
      case 'top':
        return a.top - viewportPadPx - sideOffsetPx;
      case 'right':
        return viewportWidth - viewportPadPx - a.right - sideOffsetPx;
      case 'bottom':
        return viewportHeight - viewportPadPx - a.bottom - sideOffsetPx;
      case 'left':
        return a.left - viewportPadPx - sideOffsetPx;
    }
  };

  const preferredSpace = availableMainAxisSpace(input.side);
  const oppositeSide = OPPOSITE_SIDE[input.side];
  const oppositeSpace = availableMainAxisSpace(oppositeSide);
  const popupSize =
    input.side === 'top' || input.side === 'bottom' ? input.popupHeight : input.popupWidth;

  return popupSize > preferredSpace && oppositeSpace > preferredSpace ? oppositeSide : input.side;
}

describe('computeAnchoredPosition', () => {
  const anchor = { top: 100, left: 40, right: 180, bottom: 132, width: 140, height: 32 };

  it('places a popup to the right with end alignment', () => {
    const pos = computeAnchoredPosition({
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
    assert.equal(pos.resolvedSide, 'right');
    assert.equal(pos.availableHeight, 792);
  });

  it('reports the resolved side when placement flips', () => {
    const pos = computeAnchoredPosition({
      anchorRect: { top: 2, left: 100, right: 140, bottom: 26, width: 40, height: 24 },
      popupWidth: 80,
      popupHeight: 32,
      side: 'top',
      align: 'center',
      sideOffsetPx: 4,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 400,
      viewportHeight: 300,
    });

    assert.equal(pos.resolvedSide, 'bottom');
    assert.equal(pos.y, 30);
    assert.equal(pos.availableHeight, 266);
  });

  it('keeps the preferred side when it fits even if the opposite side is larger', () => {
    const pos = computeAnchoredPosition({
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
    assert.equal(pos.resolvedSide, 'bottom');
  });

  it('clamps the alignment axis after resolving the side', () => {
    const pos = computeAnchoredPosition({
      anchorRect: { top: 100, left: 0, right: 24, bottom: 124, width: 24, height: 24 },
      popupWidth: 80,
      popupHeight: 32,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: 4,
      alignOffsetPx: -20,
      viewportPadPx: 4,
      viewportWidth: 400,
      viewportHeight: 300,
    });

    assert.equal(pos.x, 4);
    assert.equal(pos.resolvedSide, 'bottom');
  });

  it('pins an oversized popup to viewport padding on both axes', () => {
    const pos = computeAnchoredPosition({
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

    assert.equal(pos.x, 8);
    assert.equal(pos.y, 8);
  });

  it('clamps to a page collision rectangle with a non-zero origin', () => {
    const pos = computeAnchoredPosition({
      anchorRect: { top: 180, left: 820, right: 848, bottom: 208, width: 28, height: 28 },
      popupWidth: 300,
      popupHeight: 240,
      side: 'bottom',
      align: 'start',
      sideOffsetPx: 4,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 920,
      viewportHeight: 800,
      collisionRect: {
        top: 112,
        left: 64,
        right: 855,
        bottom: 766,
        width: 791,
        height: 654,
      },
    });

    assert.equal(pos.x, 551);
    assert.equal(pos.y, 212);
    assert.equal(pos.availableHeight, 550);
  });

  it('uses boundary-relative space when choosing whether to flip', () => {
    const pos = computeAnchoredPosition({
      anchorRect: { top: 140, left: 300, right: 340, bottom: 172, width: 40, height: 32 },
      popupWidth: 160,
      popupHeight: 120,
      side: 'top',
      align: 'center',
      sideOffsetPx: 4,
      alignOffsetPx: 0,
      viewportPadPx: 4,
      viewportWidth: 1200,
      viewportHeight: 800,
      collisionRect: {
        top: 112,
        left: 64,
        right: 900,
        bottom: 700,
        width: 836,
        height: 588,
      },
    });

    assert.equal(pos.resolvedSide, 'bottom');
    assert.equal(pos.y, 176);
  });
});

describe('computeAnchoredPosition flip parity with the pre-merge space-based rule', () => {
  it('resolves the same side across the full placement matrix', () => {
    let compared = 0;
    const divergences: string[] = [];

    for (const [viewportWidth, viewportHeight] of [
      [1440, 900],
      [768, 1024],
      [390, 844],
    ]) {
      for (const side of SIDES) {
        for (const align of ALIGNS) {
          for (const left of [
            -20,
            0,
            12,
            Math.round(viewportWidth / 2),
            viewportWidth - 60,
            viewportWidth + 20,
          ]) {
            for (const top of [
              -20,
              0,
              12,
              Math.round(viewportHeight / 2),
              viewportHeight - 60,
              viewportHeight + 20,
            ]) {
              for (const [width, height] of [
                [0, 0],
                [24, 24],
                [200, 48],
              ]) {
                for (const [popupWidth, popupHeight] of [
                  [120, 80],
                  [400, 600],
                  [viewportWidth + 100, 200],
                  [200, viewportHeight + 100],
                ]) {
                  for (const alignOffsetPx of [-24, 0, 16]) {
                    for (const viewportPadPx of [0, 8, 24]) {
                      const input: AnchoredPositionInput = {
                        anchorRect: {
                          top,
                          left,
                          right: left + width,
                          bottom: top + height,
                          width,
                          height,
                        },
                        popupWidth,
                        popupHeight,
                        side,
                        align,
                        sideOffsetPx: 8,
                        alignOffsetPx,
                        viewportPadPx,
                        viewportWidth,
                        viewportHeight,
                      };

                      compared += 1;
                      const actual = computeAnchoredPosition(input);
                      const legacySide = legacySpaceBasedFlipSide(input);
                      if (actual.resolvedSide !== legacySide) {
                        divergences.push(
                          `${viewportWidth}x${viewportHeight} side=${side} align=${align} ` +
                            `anchor=${left},${top} ${width}x${height} popup=${popupWidth}x${popupHeight} ` +
                            `alignOffset=${alignOffsetPx} pad=${viewportPadPx}: ` +
                            `overflow-rule=${actual.resolvedSide} space-rule=${legacySide}`
                        );
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    assert.ok(compared > 90_000, `expected a broad sweep, compared ${compared}`);
    assert.deepEqual(divergences.slice(0, 5), [], `${divergences.length} placements diverged`);
  });
});
